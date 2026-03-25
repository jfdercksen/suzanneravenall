# GitHub Actions — Suzanne Ravenall Platform

## Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `deploy.yml` | Push to `main` | Build, test, then deploy to production VPS |
| `pr-checks.yml` | PR targeting `staging` or `main` | Lint and test before merge |

---

## GitHub Secrets

Add these at: GitHub repo → Settings → Secrets and variables → Actions → New repository secret.

| Secret Name | Used In | Description |
|---|---|---|
| `VPS_HOST` | deploy-production | IP address or hostname of the production VPS |
| `VPS_USER` | deploy-production | SSH username on the production VPS (e.g. `deploy`) |
| `SSH_PRIVATE_KEY` | deploy-production | Private SSH key — the corresponding public key must be in `~/.ssh/authorized_keys` on the VPS |
| `SLACK_WEBHOOK_URL` | deploy-production | Incoming webhook URL from Slack — create at api.slack.com/apps |

---

## Production Environment Setup (Required Reviewers)

The `deploy-production` job targets a GitHub Environment named `production`. This environment must be created manually and configured with required reviewers. Every push to `main` will pause at the deploy step until an approved reviewer clicks approve in the Actions UI.

Steps:

1. GitHub repo → Settings → Environments → New environment
2. Name it exactly `production` (must match the `environment:` key in `deploy.yml`)
3. Enable "Required reviewers" — add the team members who can approve production deploys
4. Save

---

## Branch Strategy

```
feature/task-name  →  (PR reviewed and approved)  →  main  →  requires reviewer approval
                                                               →  auto-deploys to production VPS
```

Rules:

- Never push directly to `main` — always go through a PR
- `main` requires a GitHub Environment approval before the deploy job runs

---

## Manual Redeploy

**Via GitHub UI:**
1. Actions tab → Deploy workflow → Run workflow → select branch → Run workflow

**Via git (empty commit):**
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

**Via SSH directly (emergency only):**
```bash
ssh user@vps-ip
cd /var/www/suzanneravenall
docker compose up -d --remove-orphans
```
