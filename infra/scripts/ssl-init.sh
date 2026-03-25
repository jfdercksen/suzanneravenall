#!/usr/bin/env bash
# ssl-init.sh — issue Let's Encrypt certificates for all platform domains
# Run once on the VPS after the nginx container is up and port 80 is reachable.
# Requires: certbot installed on the host (not inside the container).
# Usage: bash infra/scripts/ssl-init.sh
set -euo pipefail

EMAIL="YOUR_EMAIL"
WEBROOT="/var/www/certbot"

# Each entry is a space-separated list of domains for a single certificate.
# The first domain in each entry becomes the certificate directory name.
DOMAINS=(
  "suzanneravenall.com www.suzanneravenall.com"
  "staging.suzanneravenall.com"
  "n8n.suzanneravenall.com"
  "cal.suzanneravenall.com"
  "community.suzanneravenall.com"
)

for domain_group in "${DOMAINS[@]}"; do
  primary=$(echo "$domain_group" | awk '{print $1}')

  if [ -d "/etc/letsencrypt/live/$primary" ]; then
    echo "Certificate for $primary already exists — skipping."
    continue
  fi

  domain_args=""
  for d in $domain_group; do
    domain_args="$domain_args -d $d"
  done

  echo "Requesting certificate for: $domain_group"
  certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    $domain_args
done

echo "SSL certificates issued. Restart nginx: docker compose restart nginx"
