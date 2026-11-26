#!/usr/bin/env bash
# check-compose-ports.sh: go-live N1/N4 checks on infra/docker-compose.yml (26 Nov 2026).
# Needs Docker Compose and node; no server is touched. Run from the repo root:
#   bash infra/scripts/check-compose-ports.sh
# Renders the compose file with the defaults (no infra/.env) and checks which host
# interface each published port binds to, and that Cal.com receives the Microsoft keys.
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0
check() { if [ "$2" = "$3" ]; then echo "  PASS $1"; else echo "  FAIL $1: expected [$2] got [$3]"; fail=1; fi; }

render() { docker compose -f docker-compose.yml --env-file /dev/null config --format json 2>/dev/null; }
port_ip() { # service, target port, json
  echo "$3" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const p=(JSON.parse(s).services[process.argv[1]].ports||[]).find(x=>x.target===Number(process.argv[2]));console.log(p?(p.host_ip||'0.0.0.0'):'')})" "$1" "$2"
}
has_env() { # service, name, json
  echo "$3" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const e=JSON.parse(s).services[process.argv[1]].environment||{};console.log(String(Object.prototype.hasOwnProperty.call(e,process.argv[2])))})" "$1" "$2"
}

json="$(render)"
check "payload 3001 bound to loopback by default" "127.0.0.1" "$(port_ip payload 3001 "$json")"
check "calcom 3002 still public by default (booking pages served there until F7)" "0.0.0.0" "$(port_ip calcom 3000 "$json")"
check "nginx 80 public" "0.0.0.0" "$(port_ip nginx 80 "$json")"
check "nginx 443 public" "0.0.0.0" "$(port_ip nginx 443 "$json")"
check "calcom receives MS_GRAPH_CLIENT_ID" "true" "$(has_env calcom MS_GRAPH_CLIENT_ID "$json")"
check "calcom receives MS_GRAPH_CLIENT_SECRET" "true" "$(has_env calcom MS_GRAPH_CLIENT_SECRET "$json")"

json="$(CALCOM_BIND=127.0.0.1 render)"
check "CALCOM_BIND=127.0.0.1 closes 3002 to the outside" "127.0.0.1" "$(port_ip calcom 3000 "$json")"

if [ "$fail" -ne 0 ]; then echo "compose port check: FAILED"; exit 1; fi
echo "compose port check: all passed"
