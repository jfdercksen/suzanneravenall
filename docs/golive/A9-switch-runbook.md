# A9 - DNS switch runbook: http://169.239.180.49 becomes https://suzanneravenall.com

Switch day: **Friday 27 Nov 2026**, pre-flight **Thursday 26 Nov**. Written 25 Nov 2026 from the repo (branch `claude/memberships-launch-8b7a51`) and read-only checks: public DNS, curl of public URLs, read-only SSH to aimate-db1. Nothing was changed on any server, in DNS or in mail.

**Who:**
- **Johan (VPS)**: Johan pastes the command on 169.239.180.49. We have no SSH to that box. Always from `/var/www/suzanneravenall/suzanneravenall/infra` unless the step says otherwise.
- **Johan (DNS)**: Johan in Xneelo konsoleH, the DNS host (see section 1).
- **Johan (account)**: Johan in a third-party dashboard (PayPal, Cal.com, Bunny, Backblaze).
- **Us**: we run it from Johan's PC (aimate-db1 over SSH, public checks), each write only after Johan's yes.

**Rules for the day:**
- Mail must keep working: no MX, SPF, DKIM, DMARC, autodiscover, mail., smtp., imap., pop. or verification record is touched.
- Never print a secret. The read-backs below print only URLs, names, counts or MATCH lines.
- One step at a time: do the read-back before the next step. If a read-back fails, do that step's rollback and stop.
- No deploy (GitHub Deploy workflow or manual build) between step F0 and the end of step F5: it would rebuild with whatever `.env` holds at that moment.

---

## 1. DNS facts recorded on 25 Nov 2026 (read-only)

Read with `Resolve-DnsName -Server ns1.host-h.net -DnsOnly` (authoritative) and checked against 8.8.8.8, 1.1.1.1 and 9.9.9.9 (all agree).

**Zone host: Xneelo** (formerly Hetzner South Africa). The NS records are `ns1.host-h.net`, `ns2.host-h.net`, `ns1.dns-h.com`, `ns2.dns-h.com` (TTL 7200). SOA primary `ns1.host-h.net`, contact `postmaster.suzanneravenall.com`, serial `20260925`, minimum 86400. The DNS is edited in Xneelo's konsoleH control panel. There is no Cloudflare in front (agrees with KI034). No DNSSEC (no DS record at .com). No CAA record, so Let's Encrypt is allowed. No wildcard record.

The old WordPress site is on **197.242.67.165** (reverse name `dedi1434.jnb1.host-h.net`, an Xneelo dedicated server, Apache, Let's Encrypt certificate for suzanneravenall.com, www, mail, imap, smtp, valid to 18 Jan 2027). **This is the rollback IP.**

| Name | Type | TTL (s) | Value now | On switch day |
|---|---|---|---|---|
| suzanneravenall.com | A | 7200 | 197.242.67.165 | **CHANGE to 169.239.180.49** |
| www.suzanneravenall.com | A (not a CNAME) | 7200 | 197.242.67.165 | **CHANGE to 169.239.180.49** |
| suzanneravenall.com, www | AAAA | none | none | nothing to remove (add none) |
| suzanneravenall.com | MX | 1200 | 0 suzanneravenall-com.mail.protection.outlook.com (Microsoft 365) | DO NOT TOUCH |
| suzanneravenall.com | TXT | 1200 | `v=spf1 include:spf.protection.outlook.com -all` | DO NOT TOUCH |
| suzanneravenall.com | TXT | 1200 | `brevo-code:cc07136291fe138f9843126d167f0df3` (Brevo domain verification) | DO NOT TOUCH |
| _dmarc.suzanneravenall.com | TXT | 1200 | `v=DMARC1; p=none; pct=100; rua=mailto:dmarc@fbl.optin.com;` | DO NOT TOUCH |
| brevo1._domainkey | CNAME | 1200 | b1.suzanneravenall-com.dkim.brevo.com | DO NOT TOUCH |
| brevo2._domainkey | CNAME | 1200 | b2.suzanneravenall-com.dkim.brevo.com | DO NOT TOUCH |
| autodiscover | CNAME | 1200 | autodiscover.outlook.com | DO NOT TOUCH |
| _autodiscover._tcp | SRV | 7200 | 0 100 443 mailconfig.konsoleh.co.za | DO NOT TOUCH |
| mail.suzanneravenall.com | A | 7200 | 197.242.67.165 | DO NOT TOUCH (old host's mail name) |
| smtp, imap, pop | CNAME | 7200 | mail.suzanneravenall.com | DO NOT TOUCH |
| staging.suzanneravenall.com | A | 7200 | 197.242.67.165 | DO NOT TOUCH |
| ftp.suzanneravenall.com | CNAME | 7200 | www.suzanneravenall.com | leave; see note |

DKIM selectors tried and **not found**: default, mail, google, selector1, selector2 (so Microsoft 365 DKIM is not enabled for this domain), k1, brevo, sendinblue, s1, s2, x, dkim, mail-1, mail-2, mail-a. Found: brevo1, brevo2. Also absent: cal., n8n., community., webmail., cpanel., lyncdiscover, sip, enterpriseregistration, MTA-STS, TLS-RPT.

Notes:
- **ftp.** is a CNAME to www, so once www moves, `ftp.suzanneravenall.com` points at the new VPS. Anyone who uploads to the old WordPress host by FTP must use 197.242.67.165 (or mail.suzanneravenall.com) from Friday. Changing ftp. is not needed for the switch.
- **SPF** lists only Microsoft 365. Brevo mail still passes DMARC through DKIM (brevo1/brevo2, aligned to the domain), so nothing changes here. Adding `include:spf.brevo.com` is an optional mail change for another day, not part of the switch.
- **DMARC rua** sends reports to a third party (`fbl.optin.com`). Not ours to change; flagged so Johan knows who receives the reports.
- **Do not cancel the Xneelo hosting** for at least 30 days: it is the rollback, and mail.suzanneravenall.com and staging. still live on it.
- The readiness report says staging. has no DNS. It does (old host). Not used by the new site.

### Lowering the TTL (Wednesday or Thursday)

The A records carry TTL 7200 (2 hours). If konsoleH shows a TTL field on the A records, Johan sets apex and www to **300** on **Thursday morning** (at least 2 hours, better 24 hours, before the switch) and changes nothing else. Read-back: `Resolve-DnsName suzanneravenall.com -Type A -Server ns1.host-h.net -DnsOnly` shows TTL 300 and still 197.242.67.165. If konsoleH does not offer a TTL field, plan for up to 2 hours in which some visitors still reach WordPress; that is harmless (the old site keeps working) but orders placed on WordPress in that window must be checked on Friday afternoon.

### Checking propagation

From Johan's PC (PowerShell), every few minutes after the change:

```powershell
foreach ($s in 'ns1.host-h.net','ns2.host-h.net','ns1.dns-h.com','ns2.dns-h.com','8.8.8.8','1.1.1.1','9.9.9.9') {
  foreach ($n in 'suzanneravenall.com','www.suzanneravenall.com') {
    $r = Resolve-DnsName $n -Type A -Server $s -DnsOnly -ErrorAction SilentlyContinue | Where-Object Section -eq 'Answer'
    '{0,-16} {1,-26} {2} ttl={3}' -f $s, $n, ($r.IPAddress -join ','), ($r.TTL | Select-Object -First 1)
  }
}
```

Done when all seven servers return 169.239.180.49 for both names. A public map such as dnschecker.org shows the wider picture. The four authoritative servers update within minutes of saving in konsoleH; the public resolvers follow when their cached TTL runs out.

---

## 2. Gates and decisions (each blocks the step named)

| # | Gate or decision | Owner | Blocks |
|---|---|---|---|
| G1 | **Live payments**: live PayFast merchant id/key/passphrase and live PayPal client id/secret/webhook id in `infra/.env`, `PAYFAST_SANDBOX=false`, `PAYPAL_SANDBOX=false` (both `true` today per the readiness report) | Suzanne supplies, Johan sets | F0 go/no-go; A14 G-rows |
| G2 | **Team inbox** for `CONTACT_NOTIFY_EMAIL`, `QUIZ_NOTIFY_EMAIL`, `INTAKE_NOTIFY_EMAIL` (today Johan's inbox / unset) | Suzanne names it, Johan sets | T3 (env file) |
| G3 | **Cal.com on https** (see F7). Today Cal.com answers on `http://169.239.180.49:3002`. On an https page the Cal embed script from an http address is blocked as mixed content, so the /contact and /services booking widgets fall back to a plain link after 8 s, and the link opens an http page marked "Not secure". Option a (recommended): new DNS record `cal.suzanneravenall.com A 169.239.180.49` (a new record, nothing existing changes), a certificate for it, and `cal.conf` enabled. Option b: launch with the http link and fix next week | Johan decides | F7, R4 |
| G4 | **A10 admin protection** for /medusa, /admin, /api/admin and /cms/admin (KI014, KI126): nginx allow-list, basic auth, or Cloudflare in front | Johan decides | F12 placeholder |
| G5 | **A11 coaching app** (KI113): it validates purchases against `/wp-json/pattern-coach/v1/validate` on the old site. After the switch that path answers the new site's redirect `/wp-json/:path*` -> `/`, so the app stops validating | Johan decides | F13 placeholder |
| G6 | **konsoleH login** for suzanneravenall.com (Suzanne's Xneelo account or her web admin) | Johan arranges | F1 |
| G7 | **Backblaze B2 cap**: off-box backups of aimate-db1 have failed every night since 6 Nov (cap exceeded). See A12 | Johan (account) | T1 off-box copy |
| G8 | Prerequisites R1-R3 below merged and deployed to the box by Thursday | Us, Johan deploys | T5, F3, F4 |
| G9 | Test records removed (A13), at least the two 100% vouchers | Johan, per item | F0 |

---

## 3. Prerequisites: repo changes for us before Thursday (not made by this document)

These are code changes for a normal branch, review and deploy. They are listed here so nothing is improvised on Friday.

### R1. Bring the production nginx conf level with ip-testing.conf

Diff of the two files in the repo (`infra/nginx/conf.d/ip-testing.conf` against `infra/nginx/conf.d/suzanneravenall.conf.disabled`), location by location:

| Location | ip-testing.conf | suzanneravenall.conf.disabled | Action |
|---|---|---|---|
| `/uploads/` (Medusa file-local, alias /app/uploads/) | yes | **missing** | add |
| `/api/auth` (rewrite to Medusa /auth) | yes | **missing** | add, without the http-only `X-Forwarded-Proto https` and `proxy_cookie_flags` lines |
| `/` (Next.js) | X-Forwarded-Host, X-Forwarded-Port 80, HTTP/1.1, Upgrade/Connection | only Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto | add X-Forwarded-Host, X-Forwarded-Port 443, HTTP/1.1 and Upgrade/Connection |
| `/cms` | HTTP/1.1, Upgrade/Connection, `Origin $cms_request_origin` (KI135 map) | none of these | add HTTP/1.1 and Upgrade/Connection; leave the Origin map out (https sends Sec-Fetch-Site, per DEPLOYMENT.md KI135) |
| `/n8n/` | yes | missing | leave out (n8n is retired; Medusa reaches it inside Docker at http://n8n:5678) |
| `/auth`, `/admin` | force `X-Forwarded-Proto https` and strip Secure from cookies | `$scheme`, cookies untouched | keep the production form (real TLS) |
| `/.well-known/acme-challenge/` | **missing** | yes (port 80 block) | add to ip-testing.conf too, see R2 |
| HSTS | none (http) | `max-age=31536000; includeSubDomains` | drop `includeSubDomains` at launch: mail., staging. and ftp. still point at the old host and a browser that saw the header would refuse plain http on them for a year |
| `https://www` | n/a | served as a second name on the same server, no redirect | add a 443 server for www that answers 301 to the apex, so one canonical host |

Proposed diff for `infra/nginx/conf.d/suzanneravenall.conf.disabled`:

```diff
@@ server { listen 443 ssl;
-    server_name suzanneravenall.com www.suzanneravenall.com;
+    server_name suzanneravenall.com;
@@
-    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
+    # No includeSubDomains at launch: mail., staging. and ftp. still live on the old host.
+    add_header Strict-Transport-Security "max-age=31536000" always;
+
+    # Medusa file-local uploads, served from the shared volume (was only in ip-testing.conf)
+    location /uploads/ {
+        alias /app/uploads/;
+        expires 30d;
+        add_header Cache-Control "public, immutable";
+    }
+
+    # /api/auth/* -> Medusa /auth/* (was only in ip-testing.conf). Real TLS, so no
+    # forced X-Forwarded-Proto and no cookie flag rewriting.
+    location /api/auth {
+        set $upstream_medusa http://medusa:9000;
+        rewrite ^/api/auth/?(.*)$ /auth/$1 break;
+        proxy_pass $upstream_medusa;
+        proxy_set_header Host $host;
+        proxy_set_header X-Real-IP $remote_addr;
+        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
+        proxy_set_header X-Forwarded-Proto $scheme;
+        proxy_http_version 1.1;
+    }
@@ location /cms {
         proxy_set_header X-Forwarded-Proto $scheme;
+        proxy_http_version 1.1;
+        proxy_set_header Upgrade $http_upgrade;
+        proxy_set_header Connection "upgrade";
     }
@@ location / {
         proxy_set_header X-Forwarded-Proto $scheme;
+        proxy_set_header X-Forwarded-Host $host;
+        proxy_set_header X-Forwarded-Port 443;
+        proxy_http_version 1.1;
+        proxy_set_header Upgrade $http_upgrade;
+        proxy_set_header Connection "upgrade";
     }
 }
+
+server {
+    listen 443 ssl;
+    server_name www.suzanneravenall.com;
+    ssl_certificate     /etc/letsencrypt/live/suzanneravenall.com/fullchain.pem;
+    ssl_certificate_key /etc/letsencrypt/live/suzanneravenall.com/privkey.pem;
+    ssl_protocols       TLSv1.2 TLSv1.3;
+    return 301 https://suzanneravenall.com$request_uri;
+}
```

Note: as on the review box, the `add_header Cache-Control` inside `/uploads/` means that location does not inherit the server-level security headers (nginx rule). Acceptable for static files; same behaviour as today.

The Docker DNS `resolver` the variable-based `proxy_pass` lines need is in `infra/nginx/nginx.conf` (http level), so the prod conf needs no resolver line of its own.

### R2. ACME challenge path on the review conf

Add to the `server` block of `infra/nginx/conf.d/ip-testing.conf`, above `location /`:

```nginx
    # Let's Encrypt HTTP-01 for suzanneravenall.com on switch day (ip-testing.conf is
    # still the active conf when DNS first points here)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
```

Without it, certbot's challenge on Friday reaches Next.js and fails (checked 25 Nov: `http://169.239.180.49/.well-known/acme-challenge/probe` answers 404 from the web app). The host folder `/var/www/certbot` is already mounted read-only into nginx (docker-compose.yml).

### R3. ssl-init.sh

`infra/scripts/ssl-init.sh` has `EMAIL="YOUR_EMAIL"` and asks for staging., n8n., cal. and community. certificates: those names either have no DNS or point at the old host, so the script fails or stops part-way. Fix: one entry `"suzanneravenall.com www.suzanneravenall.com"`, a real email, and add `cal.suzanneravenall.com` only if G3 option a is chosen. This runbook does not depend on the script: step F3 gives the certbot command directly.

### R4. cal.conf (only if G3 option a)

`infra/nginx/conf.d/cal.conf.disabled` proxies to `http://calcom:3002`, but the Cal.com container listens on 3000 inside Docker (`ports: "3002:3000"`). Change to `proxy_pass http://calcom:3000;` before enabling it.

### R5. Smaller follow-ups (not blocking)

- `PAYLOAD_PUBLIC_SERVER_URL` is read by `apps/payload/src/lib/cmsOrigins.ts` but `infra/docker-compose.yml` passes only `PAYLOAD_URL` to the payload container, so setting it in `.env` has no effect. `PAYLOAD_URL` alone is enough for go-live. Either pass it in compose or drop it from the checklist.
- After the switch, commit the conf swap in git (ip-testing.conf to `.disabled`, suzanneravenall.conf active) so the box's working tree matches main and a later `git pull` does not conflict with the `mv` made on Friday.
- DEPLOYMENT.md's verify line `curl -sf https://suzanneravenall.com/api/store/health` always fails (the store API needs a publishable key: 400 "Publishable API key required"). Use the checks in section 6.

---

## 4. Environment changes (names only; values are set by Johan on the box)

`infra/.env` on the VPS is read by `docker compose` for both build args and runtime env. `NEXT_PUBLIC_*` values are **baked into the web build**, so the web image must be rebuilt. Payload reads `PAYLOAD_URL` at runtime (its image builds with a placeholder), so payload and medusa only need to be recreated.

| Name | Used by | Now (pattern) | Friday (pattern) | Needs |
|---|---|---|---|---|
| NEXT_PUBLIC_SITE_URL | web build + runtime, medusa (PayFast/PayPal return and notify URLs, uploads URL), n8n | `http://169.239.180.49` (robots.txt on the box shows it, 25 Nov) | `https://suzanneravenall.com` | web rebuild; medusa, n8n recreate |
| NEXT_PUBLIC_MEDUSA_URL | web build | `http://169.239.180.49/api` | `https://suzanneravenall.com/api` | web rebuild |
| PAYLOAD_URL | payload runtime (serverURL, csrf, cors) | `http://169.239.180.49/cms` | `https://suzanneravenall.com/cms` | payload recreate |
| PAYLOAD_PUBLIC_SERVER_URL | not passed to any container (R5) | if present: IP | if present: `https://suzanneravenall.com/cms` | none today |
| STORE_CORS | medusa | `http://localhost:3000,http://169.239.180.49` | `https://suzanneravenall.com,http://169.239.180.49,http://localhost:3000` | medusa recreate |
| ADMIN_CORS | medusa | `http://localhost:7001,http://169.239.180.49` | `https://suzanneravenall.com,http://169.239.180.49,http://localhost:7001` | medusa recreate |
| AUTH_CORS | medusa | `http://localhost:7001,http://localhost:3000,http://169.239.180.49` | `https://suzanneravenall.com,http://169.239.180.49,http://localhost:7001,http://localhost:3000` | medusa recreate |
| NEXT_PUBLIC_CAL_URL | web build, medusa | `http://169.239.180.49:3002` | G3 a: `https://cal.suzanneravenall.com`; G3 b: unchanged | web rebuild |
| CALCOM_SESSION_BOOKING_URL | web, medusa | `http://169.239.180.49:3002/suzanneravenall` | G3 a: `https://cal.suzanneravenall.com/suzanneravenall` | recreate |
| NEXT_PUBLIC_WEBAPP_URL, NEXTAUTH_URL | calcom | IP:3002 | G3 a: `https://cal.suzanneravenall.com` | calcom recreate |
| NEXT_PUBLIC_SENTRY_ENVIRONMENT | web build | to read back | `production` | web rebuild |
| SENTRY_ENVIRONMENT | web, medusa | to read back | `production` | recreate |
| PAYFAST_SANDBOX, PAYPAL_SANDBOX | web, medusa | `true` | `false` (G1, with live credentials) | recreate |
| CONTACT_NOTIFY_EMAIL, QUIZ_NOTIFY_EMAIL, INTAKE_NOTIFY_EMAIL | web | Johan's inbox / unset | team inbox (G2) | web recreate |
| NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL | web, medusa, n8n | `https://suzanne.db.aimate.co.za` | **unchanged** | none |
| MEMBERSHIP_TRAINING_LEVELS | web, medusa | off | **unchanged** (KI133) | none |
| MEDUSA_BACKEND_URL / WEB_BASE_URL | internal Docker names | `http://medusa:9000`, `http://web:3000` | **unchanged** | none |

The CORS lists keep the IP for the first week so a rollback needs no CORS edit; remove it the week after. `www` is not needed in CORS because www answers 301 to the apex (R1).

n8n's own URLs (N8N_HOST, WEBHOOK_URL, N8N_EDITOR_BASE_URL) are hard-coded to the IP in docker-compose.yml. Leave them: n8n is retired and is reached only inside Docker.

---

## 5. Thursday 26 Nov: pre-flight

### T1. Backups (Johan on the VPS; us on aimate-db1 with Johan's yes)

**VPS databases and upload volumes** (Johan, VPS):

```bash
cd /var/www/suzanneravenall/suzanneravenall/infra
B=~/golive-backups/20261126; mkdir -p "$B"
for db in medusa payload calcom n8n; do
  docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$1"' sh "$db" > "$B/$db.dump" \
    && echo "OK $db $(du -h "$B/$db.dump" | cut -f1)"
done
docker volume ls --format '{{.Name}}' | grep -E '_(medusa_uploads|payload_uploads)$'
docker run --rm -v infra_medusa_uploads:/v:ro -v "$B":/b --entrypoint tar nginx:1.25-alpine czf /b/medusa_uploads.tgz -C /v .
docker run --rm -v infra_payload_uploads:/v:ro -v "$B":/b --entrypoint tar nginx:1.25-alpine czf /b/payload_uploads.tgz -C /v .
ls -la "$B"
```

Read-back (each dump lists its tables; each number must be above 0):

```bash
for f in "$B"/*.dump; do printf '%s: ' "$f"; docker compose exec -T postgres pg_restore -l < "$f" | grep -c 'TABLE DATA'; done
tar tzf "$B/medusa_uploads.tgz" | wc -l
```

If the volume names printed by `docker volume ls` do not start with `infra_`, use the printed names. Rollback: nothing to undo (read-only).

**aimate-db1 member database and Storage files** (us, with Johan's yes; writes only under ~/backups):

```bash
ssh -i ~/.ssh/aimate-db aimate@102.68.99.31
D=20261126
docker exec supabase-postgres pg_dump -U supabase_admin -Fc suzanne > ~/backups/suzanne/suzanne-pre-golive-$D.dump
sudo tar --xattrs --xattrs-include='*' -czf ~/backups/suzanne/suzanne-storage-pre-golive-$D.tgz -C ~/apps/suzanne/storage-data .
cp ~/apps/suzanne/docker-compose.yml ~/apps/suzanne/docker-compose.yml.bak-pre-golive-$D
```

Read-back:

```bash
docker exec -i supabase-postgres pg_restore -l < ~/backups/suzanne/suzanne-pre-golive-$D.dump | grep -cE 'TABLE DATA (auth users|public member_subscriptions|public novice_applications|storage objects)'   # 4
sudo tar tzf ~/backups/suzanne/suzanne-storage-pre-golive-$D.tgz | grep -c 'novice-applications/'   # 1 or more
```

**Off-box copy**: B2 refuses uploads (G7, see A12), so copy both sets to Johan's PC, to a folder outside any git repo and on an encrypted disk (the dumps hold members' personal data):

```powershell
scp -i $HOME\.ssh\aimate-db "aimate@102.68.99.31:~/backups/suzanne/*pre-golive-20261126*" C:\Backups\suzanneravenall\golive-20261126\
pscp -r <vps-user>@169.239.180.49:/home/<vps-user>/golive-backups/20261126 C:\Backups\suzanneravenall\golive-20261126\vps
```

(`pscp` with password, as for the VPS today; `<vps-user>` is Johan's VPS login.)

### T2. Env snapshot (Johan, VPS)

```bash
cd /var/www/suzanneravenall/suzanneravenall/infra
cp .env .env.pre-golive-20261126 && chmod 600 .env.pre-golive-20261126
cmp .env .env.pre-golive-20261126 && echo MATCH
```

### T3. Prepare the Friday env file (Johan, VPS)

A copy with the new values; the live `.env` is not touched until F4.

```bash
cd /var/www/suzanneravenall/suzanneravenall/infra
cp .env .env.golive && chmod 600 .env.golive
sed -i -E \
  -e 's#^NEXT_PUBLIC_SITE_URL=.*#NEXT_PUBLIC_SITE_URL=https://suzanneravenall.com#' \
  -e 's#^NEXT_PUBLIC_MEDUSA_URL=.*#NEXT_PUBLIC_MEDUSA_URL=https://suzanneravenall.com/api#' \
  -e 's#^PAYLOAD_URL=.*#PAYLOAD_URL=https://suzanneravenall.com/cms#' \
  -e 's#^PAYLOAD_PUBLIC_SERVER_URL=.*#PAYLOAD_PUBLIC_SERVER_URL=https://suzanneravenall.com/cms#' \
  -e 's#^STORE_CORS=.*#STORE_CORS=https://suzanneravenall.com,http://169.239.180.49,http://localhost:3000#' \
  -e 's#^ADMIN_CORS=.*#ADMIN_CORS=https://suzanneravenall.com,http://169.239.180.49,http://localhost:7001#' \
  -e 's#^AUTH_CORS=.*#AUTH_CORS=https://suzanneravenall.com,http://169.239.180.49,http://localhost:7001,http://localhost:3000#' \
  -e 's#^NEXT_PUBLIC_SENTRY_ENVIRONMENT=.*#NEXT_PUBLIC_SENTRY_ENVIRONMENT=production#' \
  -e 's#^SENTRY_ENVIRONMENT=.*#SENTRY_ENVIRONMENT=production#' \
  .env.golive
# Only if G3 option a (Cal.com on https):
# sed -i -E -e 's#^NEXT_PUBLIC_CAL_URL=.*#NEXT_PUBLIC_CAL_URL=https://cal.suzanneravenall.com#' \
#   -e 's#^CALCOM_SESSION_BOOKING_URL=.*#CALCOM_SESSION_BOOKING_URL=https://cal.suzanneravenall.com/suzanneravenall#' \
#   -e 's#^NEXT_PUBLIC_WEBAPP_URL=.*#NEXT_PUBLIC_WEBAPP_URL=https://cal.suzanneravenall.com#' \
#   -e 's#^NEXTAUTH_URL=.*#NEXTAUTH_URL=https://cal.suzanneravenall.com#' .env.golive
```

Then, by hand in `.env.golive` (nano): the G1 payment lines and the G2 notify addresses.

Read-back (URLs only, no secrets):

```bash
for k in NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_MEDUSA_URL PAYLOAD_URL PAYLOAD_PUBLIC_SERVER_URL STORE_CORS ADMIN_CORS AUTH_CORS NEXT_PUBLIC_CAL_URL CALCOM_SESSION_BOOKING_URL NEXT_PUBLIC_WEBAPP_URL NEXTAUTH_URL NEXT_PUBLIC_SENTRY_ENVIRONMENT SENTRY_ENVIRONMENT PAYFAST_SANDBOX PAYPAL_SANDBOX CONTACT_NOTIFY_EMAIL QUIZ_NOTIFY_EMAIL INTAKE_NOTIFY_EMAIL NEXT_PUBLIC_SUPABASE_URL; do
  grep -E "^$k=" .env.golive || echo "$k MISSING"; done
diff <(sed 's/=.*//' .env) <(sed 's/=.*//' .env.golive) && echo "SAME KEYS"
```

A `MISSING` line for a name the table says must change: add the line to `.env.golive` by hand.

### T4. Tag today's images for a fast rollback (Johan, VPS)

```bash
docker compose images
docker tag infra-web:latest infra-web:pre-golive
docker tag infra-payload:latest infra-payload:pre-golive
docker tag infra-medusa:latest infra-medusa:pre-golive
docker images | grep pre-golive
```

Use the repository names `docker compose images` prints if they are not `infra-*`. `docker system prune -f` (in the Deploy workflow) does not remove tagged images.

### T5. Deploy R1 and R2, test the challenge path (Johan, VPS, after we merge)

```bash
cd /var/www/suzanneravenall/suzanneravenall
git status --short; git branch --show-current
git pull                     # the branch that carries R1/R2
cd infra
docker compose exec nginx nginx -t && docker compose restart nginx
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
echo golive-probe | sudo tee /var/www/certbot/.well-known/acme-challenge/probe
curl -s http://169.239.180.49/.well-known/acme-challenge/probe                               # golive-probe
curl -s -H 'Host: suzanneravenall.com' http://127.0.0.1/.well-known/acme-challenge/probe      # golive-probe
```

From Johan's PC: `curl -s http://169.239.180.49/.well-known/acme-challenge/probe` answers `golive-probe`. Rollback: `git checkout` the previous commit and restart nginx.

### T6. certbot on the VPS host (Johan, VPS)

```bash
certbot --version || (sudo apt-get update && sudo apt-get install -y certbot)
systemctl list-timers --all | grep -i certbot
```

The Ubuntu/Debian package installs `certbot.timer` (twice-daily `certbot renew`). If no timer is listed, step F3 adds a cron line.

### T7. TTL down (Johan, DNS): see section 1. Nothing else in DNS on Thursday.

### T8. Go/no-go list for Friday morning (Johan)

G1 to G9 answered; A13 vouchers removed; T1 to T6 read-backs passed.

---

## 6. Friday 27 Nov: the switch

Pick a quiet hour (suggested 06:00 SAST). Expected visible break: from the moment a visitor's resolver returns the new IP until F4 is done, `https://suzanneravenall.com` gets no answer on port 443 (plain http still works on the new box). With the steps below that window is about 15-30 minutes.

### F0. Pre-build the web image with the new values (Johan, VPS) - about 15-25 min, site unaffected

```bash
cd /var/www/suzanneravenall/suzanneravenall/infra
docker compose --env-file .env.golive build web
docker image inspect infra-web:latest --format '{{.Created}}'
docker run --rm --entrypoint sh infra-web:latest -c 'grep -rl --include=*.js "https://suzanneravenall.com/api" /app/apps/web/.next 2>/dev/null | head -3'
```

Read-back: the image is newer than T4 and the grep finds at least one file (the store URL is baked in). The running container is not recreated by `build`, so the review site keeps working. Rollback: `docker tag infra-web:pre-golive infra-web:latest`.

### F1. DNS change (Johan, DNS) - 5 min

In konsoleH, zone suzanneravenall.com, edit exactly two records:
- `suzanneravenall.com` A `197.242.67.165` -> `169.239.180.49`
- `www.suzanneravenall.com` A `197.242.67.165` -> `169.239.180.49`

Touch nothing else (section 1 table). Do not add an AAAA record.

Read-back (PowerShell, at once):

```powershell
foreach ($s in 'ns1.host-h.net','ns2.host-h.net','ns1.dns-h.com','ns2.dns-h.com') { Resolve-DnsName suzanneravenall.com -Type A -Server $s -DnsOnly | Select-Object Name,IPAddress,TTL }
Resolve-DnsName suzanneravenall.com -Type MX -Server ns1.host-h.net -DnsOnly | Select-Object NameExchange
Resolve-DnsName suzanneravenall.com -Type TXT -Server ns1.host-h.net -DnsOnly | Select-Object Strings
```

All four NS give 169.239.180.49; MX is still `suzanneravenall-com.mail.protection.outlook.com`; both TXT strings unchanged. Rollback: set both A records back to `197.242.67.165`.

### F2. Wait for the authoritative servers (us) - 2-10 min

Run the propagation loop in section 1 until all four Xneelo servers return the new IP for both names. Let's Encrypt asks the authoritative servers through its own resolvers, so F3 can usually start before 8.8.8.8 has caught up.

### F3. Certificate (Johan, VPS) - 5 min

Dry run first (Let's Encrypt staging, nothing issued), then the real one. The email receives expiry warnings; `--agree-tos` accepts the Let's Encrypt subscriber agreement on Johan's behalf, so Johan runs it himself.

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d suzanneravenall.com -d www.suzanneravenall.com \
  --email johan@aiautomations.co.za --agree-tos --no-eff-email --non-interactive --dry-run
sudo certbot certonly --webroot -w /var/www/certbot \
  -d suzanneravenall.com -d www.suzanneravenall.com \
  --email johan@aiautomations.co.za --agree-tos --no-eff-email --non-interactive
sudo ls -l /etc/letsencrypt/live/suzanneravenall.com/
sudo openssl x509 -in /etc/letsencrypt/live/suzanneravenall.com/fullchain.pem -noout -subject -enddate -ext subjectAltName
```

The HTTP-01 path: Let's Encrypt fetches `http://suzanneravenall.com/.well-known/acme-challenge/<token>`; DNS sends it to this box; the active `ip-testing.conf` (R2) serves it from `/var/www/certbot`, where certbot's webroot plugin wrote the token. If the dry run fails with the old IP in the message, wait 5 minutes and retry.

**Renewal**, once:

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/sh\ndocker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml exec -T nginx nginx -s reload\n' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
systemctl list-timers --all | grep -i certbot \
  || echo '17 3,15 * * * root certbot renew --quiet' | sudo tee /etc/cron.d/certbot-renew
sudo certbot renew --dry-run
```

Read-back: `certbot renew --dry-run` ends with "Congratulations, all simulated renewals succeeded". Rollback: none needed (an unused certificate does no harm).

Option (zero gap, more work): issue the certificate on Thursday with a DNS-01 challenge (`certbot certonly --manual --preferred-challenges dns`, one TXT record `_acme-challenge` in konsoleH), so F4 can follow F1 at once. A manual certificate does not renew by itself, so re-issue it with `--webroot` after the switch. Only worth it if Johan wants no gap at all.

### F4. Switch the box (Johan, VPS) - 3-5 min

```bash
cd /var/www/suzanneravenall/suzanneravenall/infra
cp .env.golive .env
mv nginx/conf.d/ip-testing.conf nginx/conf.d/ip-testing.conf.disabled
mv nginx/conf.d/suzanneravenall.conf.disabled nginx/conf.d/suzanneravenall.conf
docker compose up -d --no-build
docker compose exec nginx nginx -t && docker compose restart nginx
docker compose ps
```

`up -d --no-build` recreates every service whose env or image changed (web on the F0 image; payload, medusa, n8n, calcom on their new env) and leaves postgres and meilisearch running. Read-back:

```bash
curl -sI http://suzanneravenall.com/ | grep -iE '^(HTTP|location)'        # 301 -> https://suzanneravenall.com/
curl -sI https://www.suzanneravenall.com/ | grep -iE '^(HTTP|location)'   # 301 -> https://suzanneravenall.com/
curl -sI https://suzanneravenall.com/ | grep -iE '^(HTTP|strict)'         # 200, HSTS without includeSubDomains
curl -s https://suzanneravenall.com/api/health
curl -s https://suzanneravenall.com/robots.txt | grep Sitemap              # https://suzanneravenall.com/sitemap.xml
curl -s https://suzanneravenall.com/ | grep -c '169.239.180.49'            # 0
```

Rollback: section 8.

### F5. Medusa and the CMS (Johan, VPS) - 5 min

```bash
docker compose exec -T medusa wget -qO- http://localhost:9000/health; echo
docker compose logs --since 10m medusa | grep -iE 'error|cors' | tail -20
curl -s -o /dev/null -w '%{http_code}\n' https://suzanneravenall.com/cms/admin/login            # 200
curl -s https://suzanneravenall.com/cms/admin/login | grep -oE '<html[^>]*>' | wc -l               # 1
curl -s -o /dev/null -w '%{http_code}\n' https://suzanneravenall.com/medusa/app                  # 200
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://suzanneravenall.com/api/auth/user/emailpass -H 'Content-Type: application/json' -d '{}'   # 400 or 401, not 404
```

Absolute IP URLs stored in the Medusa database (product images uploaded through file-local are saved with `NEXT_PUBLIC_SITE_URL` + `/uploads`). An https page loading an `http://169.239.180.49/...` image is mixed content and breaks. Read-back:

```bash
docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d medusa -At' <<'SQL'
select 'image rows with IP: ' || count(*) from image where url like 'http://169.239.180.49%' and deleted_at is null;
select 'product thumbnails with IP: ' || count(*) from product where thumbnail like 'http://169.239.180.49%' and deleted_at is null;
SQL
```

Expect above 0: on 26 Nov the live store API showed 51 of 54 product image URLs starting with `http://169.239.180.49`. The UPDATE is prepared in `docs/golive/F5-image-urls.sql` (one transaction, counts before and after, rollback statements in the file). Run it here, with Johan's yes.

### F6. Login server templates on aimate-db1 (us, with Johan's yes) - 5 min

Read 25 Nov (names, and pattern checks only):
- File `~/apps/suzanne/.env`: names APP, SITE_URL, URI_ALLOW_LIST, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, PW_AUTHENTICATOR, PW_AUTH_ADMIN, PW_STORAGE_ADMIN, REALTIME_SECRET_KEY_BASE, MAILER_AUTOCONFIRM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_ADMIN_EMAIL.
- **SITE_URL already is `https://suzanneravenall.com`** (running container GOTRUE_SITE_URL agrees). **MAILER_AUTOCONFIRM already is false** (since 6 Oct). SMTP is Brevo. **URI_ALLOW_LIST** has 2 entries: the IP callback and the https callback. So the readiness report's "SITE_URL to https, autoconfirm off" is already done.
- Still on the IP: the four template URLs, literal in `~/apps/suzanne/docker-compose.yml` (service `auth`, container `suzanne-auth`): `GOTRUE_MAILER_TEMPLATES_CONFIRMATION`, `GOTRUE_MAILER_TEMPLATES_MAGIC_LINK`, `GOTRUE_MAILER_TEMPLATES_RECOVERY`, `GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE`, each `http://169.239.180.49/email-templates/<name>.html`.

After F4 passes:

```bash
ssh -i ~/.ssh/aimate-db aimate@102.68.99.31
curl -s -o /dev/null -w '%{http_code}\n' https://suzanneravenall.com/email-templates/confirm.html   # 200 first
cd ~/apps/suzanne
cp docker-compose.yml docker-compose.yml.bak-20261127-golive
sed -i 's#http://169.239.180.49/email-templates/#https://suzanneravenall.com/email-templates/#' docker-compose.yml
grep -n 'MAILER_TEMPLATES' docker-compose.yml
docker compose up -d auth
docker inspect suzanne-auth --format '{{range .Config.Env}}{{println .}}{{end}}' | grep MAILER_TEMPLATES
```

Read-back: all four lines show `https://suzanneravenall.com/email-templates/...`; then a password reset to a plus-address (A14 I-rows) arrives in the branded template with an https link. Rollback: `cp docker-compose.yml.bak-20261127-golive docker-compose.yml && docker compose up -d auth`. The IP entry in URI_ALLOW_LIST stays for a week, then goes.

### F7. Cal.com (G3)

Option a (Johan DNS + Johan VPS, after R4 is deployed):
1. konsoleH: add `cal.suzanneravenall.com A 169.239.180.49` (new record).
2. When the four NS answer it: `sudo certbot certonly --webroot -w /var/www/certbot -d cal.suzanneravenall.com --email johan@aiautomations.co.za --agree-tos --no-eff-email --non-interactive`
3. `mv nginx/conf.d/cal.conf.disabled nginx/conf.d/cal.conf && docker compose exec nginx nginx -t && docker compose restart nginx`
4. With the T3 Cal lines applied: `docker compose --env-file .env build web && docker compose up -d --no-build web calcom medusa`
5. Read-back: `curl -sI https://cal.suzanneravenall.com/suzanneravenall/discovery-call | head -1` is 200; /contact shows the booking calendar inline.
6. Rollback: `mv nginx/conf.d/cal.conf nginx/conf.d/cal.conf.disabled`, restore the four Cal lines, rebuild web.

Option b: nothing on Friday; the booking buttons open the http Cal.com page.

### F8. Search reindex (Johan, VPS) - 2 min

```bash
docker compose exec medusa npx medusa exec ./src/scripts/seed-meilisearch.ts
curl -s 'https://suzanneravenall.com/api/search?q=repatterning' | head -c 300; echo
```

Read-back: results with programme titles. (If `medusa exec` is not available in the image, `docker compose exec medusa npx ts-node src/scripts/seed-meilisearch.ts`, as in FULL-SITE-CHECKLIST.md.) The nightly `search-reindex` job keeps it fresh after that.

### F9. Sentry environment tag (Johan, VPS)

```bash
grep -E '^(NEXT_PUBLIC_)?SENTRY_ENVIRONMENT=' .env      # both production
```

Then in Sentry (or GlitchTip on aimate-db1, if that is where the DSNs point) open the web and medusa projects and check the first new event after 10:00 carries `environment: production`. Optional: `bash scripts/test-sentry.sh` (it needs the DSNs exported; see the script header).

### F10. Webhook and callback addresses in other systems (Johan, account)

Change from the IP to https in each dashboard; read back by triggering one event (A14):
- PayPal developer dashboard, live app, Webhooks: `https://suzanneravenall.com/api/webhooks/paypal`. Copy the new webhook id to `PAYPAL_WEBHOOK_ID` if PayPal issues a new one, then `docker compose up -d --no-build web medusa`.
- Cal.com, Settings, Developer, Webhooks: `https://suzanneravenall.com/api/webhooks/calcom` (secret unchanged).
- Bunny Stream, library, Webhook URL: `https://suzanneravenall.com/api/webhooks/bunny`.
- PayFast needs nothing: its notify, return and cancel URLs are sent with each payment from `NEXT_PUBLIC_SITE_URL`.
- Google Search Console: add the https property and submit `https://suzanneravenall.com/sitemap.xml` (after A14 passes).

### F11. Old orders and mails

Links in mails sent before Friday point at `http://169.239.180.49/...`. The box now answers those with 301 to the same path on `https://suzanneravenall.com`, so they keep working. Nothing to do; checked in A14.

### F12. PLACEHOLDER: A10 admin protection (Johan's decision, G4)

Not designed here. Whatever Johan picks (nginx allow-list or basic auth on /medusa, /admin, /api/admin and /cms/admin, or Cloudflare in front), it is a repo change plus an nginx restart, with its own read-back (`curl -s -o /dev/null -w '%{http_code}' https://suzanneravenall.com/medusa/app` from outside the allow-list gives 403) and rollback.

### F13. PLACEHOLDER: A11 coaching app (Johan's decision, G5)

Not designed here. Until decided, a coaching app purchase on the new shop grants nothing (KI113), and the app's call to `/wp-json/pattern-coach/v1/validate` is redirected to the homepage. If the app must keep working on day one, the interim option is to point the app at the old WordPress host by IP (197.242.67.165) or an untouched name, which only Johan can arrange with the app's developer.

### F14. Clean-up and acceptance

Run A13 items Johan said yes to (vouchers before F0), then walk A14.

---

## 7. Verification after the switch (us, from Johan's PC)

| Check | Command or action | Pass |
|---|---|---|
| DNS everywhere | section 1 loop | 169.239.180.49 on all 7 servers |
| Mail records unchanged | `Resolve-DnsName suzanneravenall.com -Type MX -Server 8.8.8.8`, TXT, `_dmarc` TXT, `brevo1._domainkey` CNAME | same as section 1 |
| Certificate | `echo \| openssl s_client -connect suzanneravenall.com:443 -servername suzanneravenall.com 2>/dev/null \| openssl x509 -noout -issuer -subject -enddate -ext subjectAltName` | Let's Encrypt, SAN suzanneravenall.com and www, about 90 days |
| http to https | `curl -sI http://suzanneravenall.com/some/path` | 301 to `https://suzanneravenall.com/some/path` |
| www to apex | `curl -sI https://www.suzanneravenall.com/shop` and `http://www.suzanneravenall.com/shop` | 301 to `https://suzanneravenall.com/shop` |
| Old IP links | `curl -sI http://169.239.180.49/shop` | 301 to `https://suzanneravenall.com/shop` |
| No IP in pages | `curl -s https://suzanneravenall.com/ \| grep -c 169.239.180.49`; same for /shop and /contact | 0 (or only the Cal link under G3 b) |
| Sitemap and robots | `curl -s https://suzanneravenall.com/sitemap.xml \| head -5`; robots.txt | https locs, Sitemap line https |
| Uploads | open a product whose image was uploaded in Medusa admin | image loads over https |
| CMS | log in at /cms/admin in a private window, reload, open Users | stays logged in |
| Medusa admin | log in at /medusa/app | dashboard loads |
| Portal | A14 I-rows | sign-up mail link opens https |
| Mail from the site | contact form to the team inbox, read the headers | `spf=pass` or `dkim=pass` with `d=suzanneravenall.com`, `dmarc=pass` |
| Old site still reachable for rollback | `curl -skI --resolve suzanneravenall.com:443:197.242.67.165 https://suzanneravenall.com/` | 200 from Apache |

Then the full walk in A14.

---

## 8. Full rollback (any time on Friday)

Back to WordPress on the domain and the new site on the IP, in this order:

1. **DNS (Johan, DNS):** `suzanneravenall.com` and `www` A back to **197.242.67.165**. Read-back: the four Xneelo NS return 197.242.67.165.
2. **Box (Johan, VPS):**
   ```bash
   cd /var/www/suzanneravenall/suzanneravenall/infra
   cp .env.pre-golive-20261126 .env
   mv nginx/conf.d/suzanneravenall.conf nginx/conf.d/suzanneravenall.conf.disabled
   mv nginx/conf.d/ip-testing.conf.disabled nginx/conf.d/ip-testing.conf
   docker tag infra-web:pre-golive infra-web:latest
   docker tag infra-payload:pre-golive infra-payload:latest
   docker tag infra-medusa:pre-golive infra-medusa:latest
   docker compose up -d --no-build
   docker compose exec nginx nginx -t && docker compose restart nginx
   curl -s http://169.239.180.49/robots.txt | grep Sitemap     # http://169.239.180.49/sitemap.xml
   ```
   If Cal.com option a ran: `mv nginx/conf.d/cal.conf nginx/conf.d/cal.conf.disabled` before the restart.
3. **aimate-db1 (us, Johan's yes):** `cd ~/apps/suzanne && cp docker-compose.yml.bak-20261127-golive docker-compose.yml && docker compose up -d auth`. SITE_URL stays https (it already was).
4. **Dashboards (Johan):** PayPal, Cal.com and Bunny webhooks back to the IP addresses if they were changed in F10.
5. **Orders:** any order paid on the new site during the attempt stays in Medusa and is fulfilled from there; list them with the Medusa admin Orders page filtered to today.
6. The certificate in /etc/letsencrypt stays; it is reused on the next attempt.

---

## 9. The week after

- Remove the IP from the three CORS lists and from URI_ALLOW_LIST.
- Commit the conf swap (R5) and update `infra/DEPLOYMENT.md` (its checklist misses NEXT_PUBLIC_SITE_URL, the ACME path and the template URLs).
- Raise TTLs back to 7200 if they were lowered.
- KI108 newsletter link sweep.
- Consider HSTS `includeSubDomains` only once every subdomain serves https.
