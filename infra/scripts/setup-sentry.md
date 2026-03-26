# Sentry Setup — suzanneravenall.com

## 1. Create a Sentry account

Go to https://sentry.io and sign up or log in.

## 2. Create two projects

### Project 1 — Web (Next.js)
1. Sentry dashboard → Projects → Create Project
2. Platform: **Next.js**
3. Project name: `suzanneravenall-web`
4. Team: assign to your team
5. Click **Create Project**
6. Copy the DSN shown on the setup page → this is `SENTRY_DSN_WEB`

### Project 2 — Medusa backend (Node.js)
1. Projects → Create Project
2. Platform: **Node.js**
3. Project name: `suzanneravenall-medusa`
4. Click **Create Project**
5. Copy the DSN → this is `SENTRY_DSN_MEDUSA`

## 3. Find the DSN later

If you need to retrieve a DSN after initial setup:
Settings → Projects → [project name] → Client Keys (DSN)

## 4. Get the Auth Token (for source map uploads)

Settings → Auth Tokens → Create New Token
Scopes required: `project:releases`, `org:read`
This is `SENTRY_AUTH_TOKEN` — used by the Next.js build to upload source maps.

## 5. Find your organisation slug

Settings → General → Organisation Slug
This goes in `next.config.ts` as the `org` value.

## 6. Environment variables to add

Add to `infra/.env` on the VPS and to your local `.env.local`:

```
NEXT_PUBLIC_SENTRY_DSN=<DSN from suzanneravenall-web project>
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_DSN_WEB=<same DSN — server-side access>
SENTRY_DSN_MEDUSA=<DSN from suzanneravenall-medusa project>
SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=<auth token>
```

## 7. Test

After adding env vars, run:
```bash
bash infra/scripts/test-sentry.sh
```

Then check both Sentry projects for incoming events.
