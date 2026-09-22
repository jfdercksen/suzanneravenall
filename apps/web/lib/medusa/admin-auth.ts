// Authorization header for server-to-server calls to the Medusa Admin API.
//
// Medusa v2 accepts two token kinds on /admin routes:
//   - a user JWT from /auth/user/emailpass: `Authorization: Bearer <jwt>`
//   - a secret API key from Settings > API Key Management (starts with sk_):
//     `Authorization: Basic base64("<key>:")`, the key as the username with
//     an empty password (framework authenticate-middleware, getApiKeyInfo).
// Sending a secret key as Bearer answers 401, which is what happened to the
// invoice and order-confirmation routes.
export function medusaAdminAuthHeader(token: string): string {
  const trimmed = token.trim()
  if (trimmed.startsWith('sk_')) {
    return `Basic ${Buffer.from(`${trimmed}:`).toString('base64')}`
  }
  return `Bearer ${trimmed}`
}
