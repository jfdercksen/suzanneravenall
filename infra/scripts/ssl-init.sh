#!/usr/bin/env bash
# ssl-init.sh: issue the Let's Encrypt certificate(s) for the site (go-live R3, 25 Nov 2026).
# Run on the VPS host (certbot installed on the host, not in a container), after DNS for
# the names points at this server and port 80 answers the challenge path
# (/.well-known/acme-challenge/ in the active nginx conf).
#
# Usage:
#   CERTBOT_EMAIL=you@example.com bash infra/scripts/ssl-init.sh            # apex + www
#   CERTBOT_EMAIL=you@example.com INCLUDE_CAL=yes bash infra/scripts/ssl-init.sh
#   DRY_RUN=yes ... to test against Let's Encrypt staging first (no certificate stored)
#
# Only names that resolve here are requested. staging., n8n. and community. were
# removed: they have no DNS or still point at the old host, and the script stopped
# at the first one.
set -euo pipefail

EMAIL="${CERTBOT_EMAIL:?set CERTBOT_EMAIL to the address for expiry notices}"
WEBROOT="/var/www/certbot"

DOMAINS=("suzanneravenall.com www.suzanneravenall.com")
if [ "${INCLUDE_CAL:-no}" = "yes" ]; then
  DOMAINS+=("cal.suzanneravenall.com")
fi

EXTRA=()
if [ "${DRY_RUN:-no}" = "yes" ]; then
  EXTRA+=(--dry-run)
fi

for domain_group in "${DOMAINS[@]}"; do
  primary=$(echo "$domain_group" | awk '{print $1}')

  if [ -d "/etc/letsencrypt/live/$primary" ] && [ "${DRY_RUN:-no}" != "yes" ]; then
    echo "Certificate for $primary already exists: skipping."
    continue
  fi

  domain_args=()
  for d in $domain_group; do
    domain_args+=(-d "$d")
  done

  echo "Requesting certificate for: $domain_group"
  certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    ${EXTRA[@]+"${EXTRA[@]}"} \
    "${domain_args[@]}"
done

echo "Done. Then: docker compose exec nginx nginx -t && docker compose restart nginx"
echo "Renewal: certbot's own timer (systemctl list-timers | grep certbot) or the cron line in the go-live runbook."
