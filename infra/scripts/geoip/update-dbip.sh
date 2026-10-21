#!/usr/bin/env bash
# =============================================================================
# update-dbip.sh: download the DB-IP "IP to Country Lite" database for the web
# app's visitor-currency rule (DECISIONS.md D021: South Africa = ZAR, anywhere
# else = USD). Free, no account or key; licence CC BY 4.0 (credited in the
# privacy policy). DB-IP publishes a new file at the start of each month.
#
# Writes infra/geoip/dbip-country-lite.mmdb, mounted read-only into the web
# container at /data/geoip (infra/docker-compose.yml). The app re-reads the
# file within an hour of a change; no restart needed.
#
# Usage (on the VPS, as root):
#   infra/scripts/geoip/update-dbip.sh                 # download now
#   infra/scripts/geoip/update-dbip.sh --install-cron  # download + monthly cron
# =============================================================================

set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="${INFRA_DIR}/geoip"
OUT_FILE="${OUT_DIR}/dbip-country-lite.mmdb"
LOG_FILE="/var/log/suzanneravenall-geoip.log"

if [ "${1:-}" = "--install-cron" ]; then
  self="$(readlink -f "${BASH_SOURCE[0]}")"
  # 04:17 UTC on the 3rd of each month. `|| true`: grep -v exits 1 on an
  # empty result, and under pipefail that would feed crontab an empty list.
  line="17 4 3 * * /bin/bash ${self} >> ${LOG_FILE} 2>&1"
  { crontab -l 2>/dev/null | grep -v 'update-dbip.sh' || true; echo "${line}"; } | crontab -
  echo "cron installed: ${line}"
fi

mkdir -p "${OUT_DIR}"
tmp="$(mktemp "${OUT_DIR}/.dbip.XXXXXX")"
trap 'rm -f "${tmp}" "${tmp}.gz"' EXIT

fetched=""
# This month's file, else last month's (the new one can lag a day or two).
for month in "$(date -u +%Y-%m)" "$(date -u -d "$(date -u +%Y-%m-01) -1 day" +%Y-%m)"; do
  url="https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz"
  if curl -fsSL --retry 3 --max-time 120 -o "${tmp}.gz" "${url}"; then
    fetched="${month}"
    break
  fi
done
[ -n "${fetched}" ] || { echo "$(date -u +%FT%TZ) geoip: download failed"; exit 1; }

gunzip -c "${tmp}.gz" > "${tmp}"
size=$(stat -c %s "${tmp}")
# The country file is about 8 MB unpacked; anything tiny is an error page.
if [ "${size}" -lt 1000000 ]; then
  echo "$(date -u +%FT%TZ) geoip: ${fetched} file too small (${size} bytes), kept the old one"
  exit 1
fi
chmod 644 "${tmp}"
mv -f "${tmp}" "${OUT_FILE}"
echo "$(date -u +%FT%TZ) geoip: installed dbip-country-lite ${fetched} (${size} bytes)"
