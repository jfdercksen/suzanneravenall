FROM node:20-alpine AS base

# Install curl for healthcheck, and libc6-compat for alpine compatibility
RUN apk add --no-cache libc6-compat curl

# ── Dependencies stage ────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* turbo.json ./
COPY apps/payload/package.json ./apps/payload/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
RUN npm ci && npm install --cpu=x64 --os=linux --libc=musl sharp

# ── Builder stage ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy build-time values — pg throws "Invalid URL" if DATABASE_URL is unset
# when withPayload() imports payload.config.ts. Not copied into the runner stage.
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/payload_build
ENV PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime
ENV PAYLOAD_URL=http://localhost:3001/cms

# Debug: verify next.config.mjs can be loaded before attempting the full build.
# This surfaces the exact underlying error if withPayload() or any import fails.
RUN cd apps/payload && node -e \
  "import('./next.config.mjs').then(m => console.log('config ok:', JSON.stringify(m.default))).catch(e => { console.error('config failed:', e); process.exit(1) })"

# Build — fall back to direct next build so the raw Next.js error is visible
# rather than being swallowed by Turbo's output formatter.
RUN npx turbo run build --filter=@suzanne/payload -- --debug 2>&1 || \
  (cd apps/payload && npx next build 2>&1; exit 1)
ENV NODE_ENV=production

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built output (output: standalone produces a self-contained server.js)
COPY --from=builder --chown=nextjs:nodejs /app/apps/payload/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/payload/.next/static ./apps/payload/.next/static

# Ensure uploads directory exists and is writable
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3001

CMD ["node", "apps/payload/server.js"]
