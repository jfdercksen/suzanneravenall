# Nightly re-walk (READ sections of the acceptance matrix)

This is an unattended, read-only walk of the review site http://169.239.180.49. It covers sections A, B, C, D, L, M and N of `docs/testing/ACCEPTANCE.md`. It runs on aimate-db1 under `/srv/qa/suzanne`, following the design in aida-toolkit `skills/acceptance/reference.md` section F. It sends nothing. The summary is drafted for Johan and never goes to the client or the CRM.

## Files

| File | What |
|---|---|
| `qa.mcp.json` | Playwright MCP 0.0.83, headless Chromium, fresh profile, only the review origin allowed, no auto-snapshots, no images sent to the model |
| `findings.schema.json` | Section F schema plus an optional `summary` object (routes, links, blocked navigations, retries, notes) |
| `prompts/nightly.md` | The brief: A+B+C as one in-page crawl of the sitemap, D navigation and search, L data, M legal and technical, N look at 375 and 1280. Read-only rules and known/accepted items |
| `run.sh` | `claude -p` with `--bare --restricted`, explicit Playwright tool list, `dontAsk`, budget cap, JSON by schema; jq writes `out/<date>-summary.md` |

## Host (installed 20 Oct 2026)

Ubuntu 26.04, Node 22.23.3 (NodeSource), Claude Code 2.1.304 (`npm i -g`), `@playwright/mcp` 0.0.83 local in `/srv/qa/suzanne/node_modules` (Playwright 1.64.0-alpha, chromium-1247 with system deps), jq 1.8.1.

`/srv/qa/suzanne/.env` (chmod 600, never committed) holds `ANTHROPIC_API_KEY` from Vaultwarden. Optional overrides: `QA_MODEL` (default sonnet) and `QA_BUDGET_USD` (default 5).

## Deploy the files to the host

From PowerShell on the dev PC (the files need LF line endings):

```powershell
cd C:\Projects\suzanneravenall\infra\qa-nightly
tar cf $env:TEMP\qa.tar qa.mcp.json findings.schema.json run.sh prompts/nightly.md
scp -i ~/.ssh/aimate-db $env:TEMP\qa.tar aimate@102.68.99.31:/tmp/qa.tar
ssh -i ~/.ssh/aimate-db aimate@102.68.99.31 'cd /srv/qa/suzanne && tar xf /tmp/qa.tar && chmod +x run.sh'
```

## Run by hand

```bash
cd /srv/qa/suzanne && nohup ./run.sh > out/$(TZ=Africa/Johannesburg date +%F).log 2>&1 &
```

## Cron (NOT installed yet; install only after Johan's go)

02:17 SAST. The host clock is UTC, so the line uses `CRON_TZ`:

```cron
CRON_TZ=Africa/Johannesburg
17 2 * * * cd /srv/qa/suzanne && ./run.sh > out/$(date +\%F).log 2>&1
```

## Guard rails

- No Bash, no file writes: `--restricted` removes the code-running tools, and `dontAsk` denies every tool that is not on the list. `mcp__playwright__*` is deliberately not used, because it would also grant `browser_run_code_unsafe` (Node code on the host), `browser_file_upload` and `browser_fill_form`.
- `--allowed-origins` keeps the browser on the review box. It is a guard rail, not a security boundary.
- The brief forbids form submits, carts, logins and bookings. `records_created` must stay empty.
