#!/usr/bin/env bash
# =============================================================================
# test-sentry.sh — Send test errors to both Sentry projects
# Run after adding SENTRY_DSN_WEB and SENTRY_DSN_MEDUSA to the environment
# =============================================================================

set -euo pipefail

if [ -z "${SENTRY_DSN_WEB:-}" ] || [ -z "${SENTRY_DSN_MEDUSA:-}" ]; then
  echo "ERROR: SENTRY_DSN_WEB and SENTRY_DSN_MEDUSA must be set"
  echo "Run: export \$(grep -v '^#' infra/.env | xargs)"
  exit 1
fi

send_test_event() {
  local DSN="$1"
  local PROJECT="$2"

  # Parse DSN: https://<key>@<host>/<project-id>
  local KEY=$(echo "$DSN" | grep -oP '(?<=https://)[^@]+')
  local HOST=$(echo "$DSN" | grep -oP '(?<=@)[^/]+')
  local PROJECT_ID=$(echo "$DSN" | grep -oP '[^/]+$')
  local STORE_URL="https://${HOST}/api/${PROJECT_ID}/store/"

  local PAYLOAD=$(cat <<JSON
{
  "message": "Test event from test-sentry.sh — suzanneravenall.com",
  "level": "error",
  "platform": "node",
  "environment": "test",
  "tags": {"source": "manual-test"},
  "extra": {"script": "infra/scripts/test-sentry.sh", "project": "${PROJECT}"}
}
JSON
)

  echo "Sending test event to Sentry project: $PROJECT"
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$STORE_URL" \
    -H "Content-Type: application/json" \
    -H "X-Sentry-Auth: Sentry sentry_version=7, sentry_key=${KEY}" \
    -d "$PAYLOAD")

  if [ "$RESPONSE" = "200" ]; then
    echo "  OK Event sent to $PROJECT (HTTP 200)"
  else
    echo "  FAIL Unexpected response for $PROJECT: HTTP $RESPONSE"
    echo "       Check your DSN is correct"
  fi
}

send_test_event "$SENTRY_DSN_WEB" "suzanneravenall-web"
send_test_event "$SENTRY_DSN_MEDUSA" "suzanneravenall-medusa"

echo ""
echo "Check your Sentry projects for incoming events:"
echo "  https://sentry.io/organizations/your-org/issues/"
