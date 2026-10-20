#!/usr/bin/env bash
# Nightly READ-only re-walk of the review site (acceptance sections A B C D L M N).
# Lives in /srv/qa/suzanne on aimate-db1. Writes out/<date>.json, out/<date>-summary.md
# and screenshots under artifacts/<date>/. Sends nothing anywhere.
set -euo pipefail
cd "$(dirname "$0")"

set -a; . ./.env; set +a
: "${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY missing in .env}"

DATE=$(TZ=Africa/Johannesburg date +%F)
OUT="out/$DATE.json"
SUMMARY="out/$DATE-summary.md"
mkdir -p out "artifacts/$DATE"

PROMPT=$(sed "s/{{DATE}}/$DATE/g" prompts/nightly.md)

# Explicit list: mcp__playwright__* would also grant browser_run_code_unsafe
# (Node-side code on this host), file upload and form fill.
P=mcp__playwright__browser
TOOLS="${P}_navigate,${P}_navigate_back,${P}_snapshot,${P}_find,${P}_click,${P}_hover,${P}_press_key,${P}_type,${P}_resize,${P}_wait_for,${P}_evaluate,${P}_take_screenshot,${P}_console_messages,${P}_network_requests,${P}_tabs,${P}_close"

start=$(date +%s)
set +e
timeout 45m claude -p "$PROMPT" \
  --bare --restricted \
  --model "${QA_MODEL:-sonnet}" \
  --mcp-config qa.mcp.json --strict-mcp-config \
  --allowedTools "$TOOLS" \
  --permission-mode dontAsk \
  --max-budget-usd "${QA_BUDGET_USD:-5}" \
  --no-session-persistence \
  --output-format json \
  --json-schema "$(cat findings.schema.json)" \
  > "$OUT"
rc=$?
set -e
wall=$(( $(date +%s) - start ))

jq -r --arg date "$DATE" --arg wall "$wall" --arg rc "$rc" '
  def cut(n): if (. // "" | length) > n then (.[0:n] + "...") else (. // "") end;
  def esc: gsub("\\|"; "/") | gsub("\n"; " ");
  (.structured_output // null) as $s
  | (($s.rows // []) | map(select(.verdict != "PASS"))) as $open
  | [
      "# Nightly re-walk \($date) - Suzanne Ravenall review site",
      "",
      "| | |",
      "|---|---|",
      "| Cost | $\(.total_cost_usd // 0 | . * 100 | round / 100) |",
      "| Wall time | \(($wall | tonumber) / 60 | floor) min \(($wall | tonumber) % 60) s |",
      "| Routes / links | \($s.summary.routes_checked // "?") pages, \($s.summary.links_checked // "?") links |",
      "| Rows | \(($s.rows // []) | length): PASS \(($s.rows // []) | map(select(.verdict == "PASS")) | length), FAIL \(($s.rows // []) | map(select(.verdict == "FAIL")) | length), N/A \(($s.rows // []) | map(select(.verdict == "N/A")) | length), BLOCKED \(($s.rows // []) | map(select(.verdict == "BLOCKED")) | length) |",
      "| Run | \(.subtype // "no result") (exit \($rc), \(.num_turns // "?") turns) |",
      "",
      (if $s == null then "No structured result: \(.result // "see the .json and .log" | cut(400) | esc)"
       elif ($open | length) == 0 then "No findings. Every row PASS."
       else "| Id | Verdict | Severity | What | Seen |\n|---|---|---|---|---|\n"
            + ($open | map("| \(.id) | \(.verdict) | \(.severity // "") | \(.item | esc | cut(70)) | \(.actual | esc | cut(180)) |") | join("\n"))
       end),
      "",
      "Notes: \($s.summary.notes // "none" | esc)",
      "Files: /srv/qa/suzanne/out/\($date).json, artifacts/\($date)/",
      "",
      "Drafted for Johan, not sent"
    ] | join("\n")
' "$OUT" > "$SUMMARY" || echo "summary failed (exit $rc), see $OUT" > "$SUMMARY"

cat "$SUMMARY"
exit "$rc"
