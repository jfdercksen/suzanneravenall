---
globs: ["**/auth/**", "**/api/**", "**/middleware.ts", "**/webhooks/**"]
---

## Security Rules — Auth, API, and Webhook Files

- Every API route must validate input with Zod before processing
- Every authenticated route must call `supabase.auth.getSession()` and check for a valid session before any logic
- Every admin route must additionally verify `profile.role === 'admin'`
- Never return internal error details, stack traces, or database schema in API responses
- Never log passwords, tokens, card numbers, or personal data
- Every webhook handler must verify the request signature before processing the payload
- PayFast ITN must be validated against PayFast's verification endpoint
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any `*_SECRET` variable to the browser
- Never use `dangerouslySetInnerHTML` without DOMPurify sanitisation
- All Supabase queries from API routes use the route handler client (not the service role) so RLS is enforced
- Never hardcode secrets — always read from `process.env`
