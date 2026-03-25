#!/usr/bin/env bash
# =============================================================================
# install-backup-cron.sh — One-time setup for the backup system
# Run once on the VPS as root after first deploy.
#
# What this script does:
#   1. Installs the Backblaze B2 CLI (via pip3) if not already present
#   2. Installs postgresql-client (provides pg_dump) if not already present
#   3. Makes backup.sh executable
#   4. Creates the log file with correct permissions
#   5. Installs a cron job that runs backup.sh daily at 00:00 UTC (02:00 SAST)
#
# After running this script you must authorise the b2 CLI manually:
#   b2 authorize-account <B2_KEY_ID> <B2_APPLICATION_KEY>
# =============================================================================

set -euo pipefail

SCRIPT_PATH="/var/www/suzanneravenall/suzanneravenall/infra/scripts/backup.sh"
LOG_FILE="/var/log/suzanneravenall-backup.log"
# Cron expression: minute hour day month weekday
# 0 0 = 00:00 UTC = 02:00 SAST (UTC+2)
CRON_JOB="0 0 * * * ${SCRIPT_PATH} >> ${LOG_FILE} 2>&1"

echo "=== Installing backup system ==="

# --- 1. Backblaze B2 CLI -----------------------------------------------------

if ! command -v b2 &>/dev/null; then
  echo "Installing Backblaze B2 CLI..."
  pip3 install b2 || pip install b2
  echo "  OK b2 installed: $(b2 version)"
else
  echo "  OK b2 already installed: $(b2 version)"
fi

# --- 2. postgresql-client (provides pg_dump / psql) --------------------------

if ! command -v pg_dump &>/dev/null; then
  echo "Installing postgresql-client..."
  apt-get update -q && apt-get install -y -q postgresql-client
  echo "  OK pg_dump installed"
else
  echo "  OK pg_dump already available"
fi

# --- 3. Make backup script executable ----------------------------------------

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "ERROR: backup.sh not found at $SCRIPT_PATH"
  echo "       Ensure the repo is checked out at /var/www/suzanneravenall/suzanneravenall"
  exit 1
fi

chmod +x "$SCRIPT_PATH"
echo "  OK backup.sh is executable"

# --- 4. Create log file ------------------------------------------------------

if [ ! -f "$LOG_FILE" ]; then
  touch "$LOG_FILE"
  chmod 644 "$LOG_FILE"
  echo "  OK Log file created: $LOG_FILE"
else
  echo "  OK Log file already exists: $LOG_FILE"
fi

# --- 5. Install cron job -----------------------------------------------------

if crontab -l 2>/dev/null | grep -qF "$SCRIPT_PATH"; then
  echo "  OK Cron job already installed — no change"
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "  OK Cron job installed: runs daily at 00:00 UTC (02:00 SAST)"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Authorise the b2 CLI with your Backblaze credentials:"
echo "     b2 authorize-account <B2_KEY_ID> <B2_APPLICATION_KEY>"
echo ""
echo "  2. Ensure these environment variables are set in /etc/environment"
echo "     (or sourced before the cron job runs):"
echo "     POSTGRES_HOST=<container-ip-or-hostname>"
echo "     POSTGRES_USER=<value from infra/.env>"
echo "     POSTGRES_PASSWORD=<value from infra/.env>"
echo "     B2_BUCKET_NAME=<your-bucket-name>"
echo "     SLACK_WEBHOOK_URL=<optional>"
echo ""
echo "  3. Run a manual test before relying on the cron job:"
echo "     $SCRIPT_PATH"
echo ""
echo "  4. Verify the log:"
echo "     tail -f $LOG_FILE"
