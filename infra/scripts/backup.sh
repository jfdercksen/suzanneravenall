#!/usr/bin/env bash
# =============================================================================
# backup.sh — Daily backup for suzanneravenall.com
# Runs at 02:00 SAST (00:00 UTC) via cron
# Dumps all Postgres databases + n8n workflows → uploads to Backblaze B2
#
# Required environment variables (set in /etc/environment or .env on the VPS):
#   POSTGRES_HOST       — Docker service hostname (default: localhost if pg_dump
#                         runs on the host; set to "localhost" with port-mapped
#                         postgres, or use "docker exec" pattern if no port exposed)
#   POSTGRES_USER       — Postgres superuser (matches POSTGRES_USER in .env)
#   POSTGRES_PASSWORD   — Postgres password (matches POSTGRES_PASSWORD in .env)
#   B2_BUCKET_NAME      — Backblaze B2 bucket name
#   SLACK_WEBHOOK_URL   — (optional) Slack incoming webhook URL for failure alerts
#
# The b2 CLI must already be authorised before this script runs:
#   b2 authorize-account <B2_KEY_ID> <B2_APPLICATION_KEY>
# =============================================================================

set -uo pipefail

# --- Config ------------------------------------------------------------------
LOG_FILE="/var/log/suzanneravenall-backup.log"
DATE=$(date +%Y-%m-%d)
MONTH=$(date +%Y-%m)
BACKUP_DIR="/tmp/suzanneravenall-backups/${DATE}"
# POSTGRES_HOST defaults to "localhost" but should be overridden when the
# postgres container port is not published to the host. In that case, use the
# docker exec pattern below instead of a direct pg_dump connection.
POSTGRES_USER="${POSTGRES_USER}"
# b2 CLI v4 requires B2_APPLICATION_KEY_ID (not B2_KEY_ID)
export B2_APPLICATION_KEY_ID="${B2_KEY_ID}"
export B2_APPLICATION_KEY="${B2_APPLICATION_KEY}"

# Databases to dump — must all exist on the shared postgres instance.
DATABASES=(medusa n8n payload calcom)

ERRORS=0

# --- Helpers -----------------------------------------------------------------

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

alert() {
  local message="$1"
  log "ALERT: $message"
  # Post to Slack if a webhook URL is configured. Failures here are non-fatal.
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -s -X POST "$SLACK_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"Backup alert — suzanneravenall.com: $message\"}" \
      >> "$LOG_FILE" 2>&1 || true
  fi
}

# --- Setup -------------------------------------------------------------------

mkdir -p "$BACKUP_DIR"
log "=== Backup started: $DATE ==="

# --- 1. PostgreSQL dumps -----------------------------------------------------
# pg_dump connects directly to the postgres container.
# The postgres service does NOT publish a host port in production, so this
# script must run where it can reach the container — either:
#   a) On the VPS host with POSTGRES_HOST set to the container IP, or
#   b) Via `docker exec` if a host connection is not available.
# This script uses the direct connection approach. If that ever fails, fall
# back to: docker exec infra-postgres-1 pg_dump -U "$POSTGRES_USER" "$DB"

for DB in "${DATABASES[@]}"; do
  log "Dumping database: $DB"
  DUMP_FILE="${BACKUP_DIR}/${DB}_${DATE}.sql.gz"

  # Run pg_dump inside the postgres container to avoid host version mismatch
  if docker exec infra-postgres-1 \
      pg_dump -U "$POSTGRES_USER" -d "$DB" \
    | gzip > "$DUMP_FILE"; then
    log "  OK $DB -> $(du -sh "$DUMP_FILE" | cut -f1)"
  else
    log "  FAIL Failed to dump $DB"
    alert "pg_dump failed for database: $DB on $DATE"
    ERRORS=$((ERRORS + 1))
  fi
done

# --- 2. n8n workflow export --------------------------------------------------
# n8n's CLI exports all workflows to JSON. We export inside the container and
# copy the file out so it can be uploaded alongside the database dumps.
# Container name assumes the compose project is named "infra" (the default when
# docker compose is run from the infra/ directory).

log "Exporting n8n workflows"
N8N_EXPORT_FILE="${BACKUP_DIR}/n8n-workflows_${DATE}.json"

if docker exec infra-n8n-1 n8n export:workflow --all --output=/tmp/n8n-workflows.json \
    >> "$LOG_FILE" 2>&1 && \
   docker cp infra-n8n-1:/tmp/n8n-workflows.json "$N8N_EXPORT_FILE" \
    >> "$LOG_FILE" 2>&1; then
  log "  OK n8n workflows exported -> $(du -sh "$N8N_EXPORT_FILE" | cut -f1)"
else
  # Non-fatal — no workflows exist yet during early development
  log "  WARN n8n workflow export skipped (no workflows or export failed)"
fi

# --- 3. Upload to Backblaze B2 -----------------------------------------------
# Each file is uploaded under daily/YYYY-MM-DD/ so the retention script can
# identify the date from the path without parsing filenames.

log "Uploading to Backblaze B2 bucket: ${B2_BUCKET_NAME}"

for FILE in "$BACKUP_DIR"/*; do
  FILENAME=$(basename "$FILE")
  B2_PATH="daily/${DATE}/${FILENAME}"

  if b2 upload-file "${B2_BUCKET_NAME}" "$FILE" "$B2_PATH" >> "$LOG_FILE" 2>&1; then
    log "  OK Uploaded: $B2_PATH"
  else
    log "  FAIL Upload failed: $FILENAME"
    alert "B2 upload failed for $FILENAME on $DATE"
    ERRORS=$((ERRORS + 1))
  fi
done

# --- 4. Monthly backup copy --------------------------------------------------
# On the first day of the month, also copy files to the monthly/ prefix so they
# are preserved beyond the 30-day daily retention window.

DAY_OF_MONTH=$(date +%d)
if [ "$DAY_OF_MONTH" = "01" ]; then
  log "First of month — creating monthly backup copy"
  for FILE in "$BACKUP_DIR"/*; do
    FILENAME=$(basename "$FILE")
    B2_MONTHLY_PATH="monthly/${MONTH}/${FILENAME}"
    if b2 upload-file "${B2_BUCKET_NAME}" "$FILE" "$B2_MONTHLY_PATH" >> "$LOG_FILE" 2>&1; then
      log "  OK Monthly copy: $B2_MONTHLY_PATH"
    else
      log "  FAIL Monthly copy failed: $FILENAME"
      # Count as an error but do not alert separately — the daily upload
      # already succeeded so data is not lost.
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

# --- 5. Retention — delete daily backups older than 30 days ------------------
# Monthly backups older than 12 months (365 days) are also deleted.
# b2 ls output format: <fileId> <action> <date> <time> <size> <name>
# We extract the name (last field) and parse the date from the path prefix.

log "Applying retention policy (keep 30 daily, 12 monthly)"

CUTOFF_DAILY=$(date -d '30 days ago' +%Y-%m-%d)
b2 ls --long "b2://${B2_BUCKET_NAME}/daily/" 2>/dev/null \
  | while read -r _ _ _ _ B2_FILE_PATH; do
      FILE_DATE=$(echo "$B2_FILE_PATH" | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
      if [ -n "$FILE_DATE" ] && [ "$FILE_DATE" \< "$CUTOFF_DAILY" ]; then
        log "  Deleting old daily backup: $B2_FILE_PATH"
        b2 rm "b2://${B2_BUCKET_NAME}/${B2_FILE_PATH}" >> "$LOG_FILE" 2>&1 || true
      fi
    done

CUTOFF_MONTHLY=$(date -d '365 days ago' +%Y-%m)
b2 ls --long "b2://${B2_BUCKET_NAME}/monthly/" 2>/dev/null \
  | while read -r _ _ _ _ B2_FILE_PATH; do
      FILE_MONTH=$(echo "$B2_FILE_PATH" | grep -oP '\d{4}-\d{2}' | head -1)
      if [ -n "$FILE_MONTH" ] && [ "$FILE_MONTH" \< "$CUTOFF_MONTHLY" ]; then
        log "  Deleting old monthly backup: $B2_FILE_PATH"
        b2 rm "b2://${B2_BUCKET_NAME}/${B2_FILE_PATH}" >> "$LOG_FILE" 2>&1 || true
      fi
    done

# --- 6. Cleanup --------------------------------------------------------------

rm -rf "$BACKUP_DIR"
log "Local temp files cleaned up"

# --- 7. Summary --------------------------------------------------------------

if [ "$ERRORS" -eq 0 ]; then
  log "=== Backup completed successfully ==="
else
  log "=== Backup completed with $ERRORS error(s) — check log above ==="
  alert "Backup on $DATE completed with $ERRORS error(s). Check $LOG_FILE on the VPS."
fi
