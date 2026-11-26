#!/usr/bin/env bash
# test-config.sh: check the nginx confs in the real nginx image, without a server
# (go-live R1 to R4, 25 Nov 2026). Needs Docker. Run from the repo root:
#   bash infra/nginx/test-config.sh
# For each conf set it runs `nginx -t`, then starts nginx and checks the behaviour the
# switch depends on: the ACME challenge path, http to https, www to the apex, HSTS
# without includeSubDomains. Upstreams (web, medusa, payload, calcom) are not running,
# so proxied paths answer 502; that is expected and not checked.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
IMAGE="nginx:1.25-alpine"   # as infra/nginx/Dockerfile
WORK="$(mktemp -d)"
trap 'docker rm -f nginx-conf-test >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT
fail=0
check() { # name, expected, actual
  if [ "$2" = "$3" ]; then echo "  PASS $1"; else echo "  FAIL $1: expected [$2] got [$3]"; fail=1; fi
}

# Self-signed certificates where the confs expect Let's Encrypt ones.
for name in suzanneravenall.com cal.suzanneravenall.com; do
  mkdir -p "$WORK/letsencrypt/live/$name"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 -subj "/CN=$name" \
    -keyout "$WORK/letsencrypt/live/$name/privkey.pem" \
    -out "$WORK/letsencrypt/live/$name/fullchain.pem" >/dev/null 2>&1
done
mkdir -p "$WORK/certbot/.well-known/acme-challenge" "$WORK/uploads" "$WORK/next"
echo "token-ok" > "$WORK/certbot/.well-known/acme-challenge/probe"

run_set() { # label, conf files...
  local label="$1"; shift
  local confd="$WORK/conf.d-$label"
  mkdir -p "$confd"
  for f in "$@"; do cp "$ROOT/conf.d/$f" "$confd/$(basename "$f" .disabled)"; done
  echo "== $label: $*"
  docker rm -f nginx-conf-test >/dev/null 2>&1 || true
  local args=(
    -v "$ROOT/nginx.conf:/etc/nginx/nginx.conf:ro"
    -v "$confd:/etc/nginx/conf.d:ro"
    -v "$WORK/letsencrypt:/etc/letsencrypt:ro"
    -v "$WORK/certbot:/var/www/certbot:ro"
    -v "$WORK/uploads:/app/uploads:ro"
    -v "$WORK/next:/var/www/next/_next/static:ro"
    # cal.conf names its upstream literally, so it must resolve at startup.
    --add-host calcom:127.0.0.1 --add-host web:127.0.0.1 --add-host medusa:127.0.0.1
    --add-host payload:127.0.0.1 --add-host n8n:127.0.0.1
  )
  if docker run --rm "${args[@]}" "$IMAGE" nginx -t 2>&1 | tail -2; then
    echo "  PASS nginx -t"
  else
    echo "  FAIL nginx -t"; fail=1; return
  fi
  docker run -d --name nginx-conf-test -p 18080:80 -p 18443:443 "${args[@]}" "$IMAGE" >/dev/null
  sleep 2
}

code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
location() { curl -s -o /dev/null -w '%{redirect_url}' "$@"; }

# 1. The review box today (R2): ip-testing.conf must answer the ACME challenge itself.
run_set review ip-testing.conf
check "review: ACME challenge served from the webroot" "token-ok" \
  "$(curl -s -H 'Host: suzanneravenall.com' http://127.0.0.1:18080/.well-known/acme-challenge/probe)"
docker rm -f nginx-conf-test >/dev/null

# 2. Production after the switch (R1): suzanneravenall.conf alone.
run_set production suzanneravenall.conf.disabled
R="--resolve suzanneravenall.com:18443:127.0.0.1 --resolve www.suzanneravenall.com:18443:127.0.0.1 -k"
check "prod: ACME challenge on port 80" "token-ok" \
  "$(curl -s -H 'Host: suzanneravenall.com' http://127.0.0.1:18080/.well-known/acme-challenge/probe)"
check "prod: http apex to https apex" "301 https://suzanneravenall.com/shop?x=1" \
  "$(code -H 'Host: suzanneravenall.com' 'http://127.0.0.1:18080/shop?x=1') $(location -H 'Host: suzanneravenall.com' 'http://127.0.0.1:18080/shop?x=1')"
check "prod: http www to https apex" "301 https://suzanneravenall.com/about" \
  "$(code -H 'Host: www.suzanneravenall.com' http://127.0.0.1:18080/about) $(location -H 'Host: www.suzanneravenall.com' http://127.0.0.1:18080/about)"
# shellcheck disable=SC2086
check "prod: https www to https apex" "301 https://suzanneravenall.com/about" \
  "$(code $R https://www.suzanneravenall.com:18443/about) $(location $R https://www.suzanneravenall.com:18443/about)"
# shellcheck disable=SC2086
hsts="$(curl -s -D - -o /dev/null $R https://suzanneravenall.com:18443/ | tr -d '\r' | grep -i '^strict-transport-security:' | cut -d' ' -f2-)"
check "prod: HSTS without includeSubDomains" "max-age=31536000" "$hsts"
echo "hello" > "$WORK/uploads/probe.txt"
# shellcheck disable=SC2086
check "prod: /uploads/ served from the uploads volume" "hello" "$(curl -s $R https://suzanneravenall.com:18443/uploads/probe.txt)"
docker rm -f nginx-conf-test >/dev/null

# 3. Production plus Cal.com (R4), as on switch day if option a is chosen.
run_set production-cal suzanneravenall.conf.disabled cal.conf.disabled
C="--resolve cal.suzanneravenall.com:18443:127.0.0.1 -k"
# shellcheck disable=SC2086
calh="$(curl -s -D - -o /dev/null $C https://cal.suzanneravenall.com:18443/ | tr -d '\r')"
check "cal: no X-Frame-Options (the site embeds the calendar, N2)" "" \
  "$(echo "$calh" | grep -i '^x-frame-options:' || true)"
check "cal: frame-ancestors allows the site" \
  "content-security-policy: frame-ancestors 'self' https://suzanneravenall.com https://www.suzanneravenall.com http://169.239.180.49" \
  "$(echo "$calh" | grep -i '^content-security-policy:' | sed 's/^[Cc]ontent-[Ss]ecurity-[Pp]olicy:/content-security-policy:/')"
check "cal: HSTS without includeSubDomains" "max-age=31536000" \
  "$(echo "$calh" | grep -i '^strict-transport-security:' | cut -d' ' -f2-)"
check "cal: http to https" "301 https://cal.suzanneravenall.com/x" \
  "$(code -H 'Host: cal.suzanneravenall.com' http://127.0.0.1:18080/x) $(location -H 'Host: cal.suzanneravenall.com' http://127.0.0.1:18080/x)"
docker rm -f nginx-conf-test >/dev/null

if [ "$fail" -ne 0 ]; then echo "nginx conf check: FAILED"; exit 1; fi
echo "nginx conf check: all passed"
