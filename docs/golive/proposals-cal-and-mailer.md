# Proposals: Cal.com on https, and the login server's mail templates (25 Nov 2026)

Proposals only. Nothing here is applied. Each needs Johan's yes, and the DNS record is his to add in konsoleH.

## 1. cal.suzanneravenall.com, so bookings work on https

**Why:**
- Today Cal.com answers on `http://169.239.180.49:3002`.
- After the switch the site is https. A browser blocks an http booking embed on an https page as mixed content, so the booking calendars on /contact and /services would fall back to a plain link to an http page marked "Not secure".

**Proposal:** give Cal.com its own https name on the same server.

### DNS (Johan, konsoleH, Xneelo)

- **Where:** Domains, suzanneravenall.com, DNS settings (the zone served by ns1/ns2.host-h.net and ns1/ns2.dns-h.com).
- **Add one new record:** `cal` A `169.239.180.49`, TTL 300 (or the lowest konsoleH allows).
- **Changes nothing that exists.** There is no cal record today. Mail (MX, SPF, DKIM brevo1/brevo2, DMARC, autodiscover) is untouched.
- **When:** any time before Friday. The name only answers once the record exists, and the site does not use it until the env below is switched.

### Certificate (Johan, VPS, after the record answers)

```bash
dig +short cal.suzanneravenall.com @ns1.host-h.net          # 169.239.180.49
cd /var/www/suzanneravenall/suzanneravenall
CERTBOT_EMAIL=<address for expiry notices> INCLUDE_CAL=yes DRY_RUN=yes bash infra/scripts/ssl-init.sh
CERTBOT_EMAIL=<address for expiry notices> INCLUDE_CAL=yes bash infra/scripts/ssl-init.sh
```

The challenge for cal. is served by `ip-testing.conf`, which has the ACME path from R2, so this works before the main switch.

### nginx (repo change R4, already on branch claude/golive-nginx)

- `cal.conf.disabled` now proxies to `calcom:3000`, the port Cal.com listens on inside Docker. Before, it pointed at 3002 and would have failed.
- Its HSTS no longer has includeSubDomains.
- **To enable on the box:** `mv infra/nginx/conf.d/cal.conf.disabled infra/nginx/conf.d/cal.conf`, then `docker compose exec nginx nginx -t && docker compose restart nginx`.
- The CI check (workflow nginx-config-check) proves it together with the production conf.

### Env (Johan, VPS, infra/.env; names and new values)

| Name | Read by | Now | After |
|---|---|---|---|
| NEXT_PUBLIC_CAL_URL | web (baked into the build) | http://169.239.180.49:3002 | https://cal.suzanneravenall.com |
| CALCOM_SESSION_BOOKING_URL | web, medusa (links in order mails) | http://169.239.180.49:3002/suzanneravenall... | https://cal.suzanneravenall.com/suzanneravenall... (keep the path, change the origin) |
| NEXT_PUBLIC_WEBAPP_URL | calcom | http://169.239.180.49:3002 | https://cal.suzanneravenall.com |
| NEXTAUTH_URL | calcom | http://169.239.180.49:3002 | https://cal.suzanneravenall.com |

**Then:**
- Rebuild web, because NEXT_PUBLIC_CAL_URL is baked in at build: this is the F0 pre-build on Friday, or a separate web build.
- Recreate calcom and medusa: `docker compose up -d --no-build calcom medusa`.

### In Cal.com itself (Johan, Cal.com admin)

The webhook that tells the site about bookings must post to `https://suzanneravenall.com/api/webhooks/calcom` after the switch. This is runbook step F10.

### Read-back

```bash
curl -sI https://cal.suzanneravenall.com/suzanneravenall/discovery-call | head -1    # 200
```

/contact and /services show the calendar inline, not the fallback link.

### Rollback

1. `mv infra/nginx/conf.d/cal.conf infra/nginx/conf.d/cal.conf.disabled` and restart nginx.
2. Put the four env values back and rebuild web.
3. The DNS record can stay.

### Risk

The calcom image is `calcom/cal.com:latest` and bakes NEXT_PUBLIC_WEBAPP_URL at its own build. The official image swaps the placeholder at start-up, but if a login or booking page still shows the IP after the recreate, Cal.com needs its own rebuild. Test it on Thursday with the record in place, before the main switch.

**Option b (no change):** launch with the plain link to the http Cal.com page, and do this the week after.

## 2. The login server's mail templates (aimate-db1)

**Why:**
- The login server (GoTrue) fetches the branded templates for its four mails from the website.
- Today they come from the IP over plain http. After the switch, the site at the IP answers with redirects, and the templates should come from the real address.

Read 25 Nov, read-only: `~/apps/suzanne/docker-compose.yml` on aimate-db1, service `auth` (container `suzanne-auth`), lines 37 to 40.

| Line | Before | After |
|---|---|---|
| 37 | `GOTRUE_MAILER_TEMPLATES_CONFIRMATION: http://169.239.180.49/email-templates/confirm.html` | `GOTRUE_MAILER_TEMPLATES_CONFIRMATION: https://suzanneravenall.com/email-templates/confirm.html` |
| 38 | `GOTRUE_MAILER_TEMPLATES_MAGIC_LINK: http://169.239.180.49/email-templates/magic-link.html` | `GOTRUE_MAILER_TEMPLATES_MAGIC_LINK: https://suzanneravenall.com/email-templates/magic-link.html` |
| 39 | `GOTRUE_MAILER_TEMPLATES_RECOVERY: http://169.239.180.49/email-templates/reset-password.html` | `GOTRUE_MAILER_TEMPLATES_RECOVERY: https://suzanneravenall.com/email-templates/reset-password.html` |
| 40 | `GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE: http://169.239.180.49/email-templates/email-change.html` | `GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE: https://suzanneravenall.com/email-templates/email-change.html` |

**Already right, no change:**
- SITE_URL is `https://suzanneravenall.com`.
- MAILER_AUTOCONFIRM is false.
- URI_ALLOW_LIST already holds the https callback. Its IP entry stays for a week, then goes.

### When

Friday, only after the switch, and once `https://suzanneravenall.com/email-templates/confirm.html` answers 200. Before that, the https address still reaches the old WordPress site, which has no templates, and the login mails would lose their branding.

### Commands (us on aimate-db1, with Johan's yes; runbook F6)

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://suzanneravenall.com/email-templates/confirm.html   # 200 first
cd ~/apps/suzanne
cp docker-compose.yml docker-compose.yml.bak-20261127-golive
sed -i 's#http://169.239.180.49/email-templates/#https://suzanneravenall.com/email-templates/#' docker-compose.yml
grep -n 'MAILER_TEMPLATES' docker-compose.yml
docker compose up -d auth
docker inspect suzanne-auth --format '{{range .Config.Env}}{{println .}}{{end}}' | grep MAILER_TEMPLATES
```

- **Read-back:** all four show https. A password reset to a plus-address arrives in the branded template with an https link.
- **Rollback:** `cp docker-compose.yml.bak-20261127-golive docker-compose.yml && docker compose up -d auth`.
- **What it restarts:** only the `auth` container of the suzanne stack, a few seconds of downtime for sign-in on the site. Other apps on aimate-db1 are not touched.
