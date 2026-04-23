FROM node:20-alpine AS base

# Install curl for healthcheck, and libc6-compat for alpine compatibility
RUN apk add --no-cache libc6-compat curl

# ── Dependencies stage ────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci && npm install --cpu=x64 --os=linux --libc=musl sharp

# ── Builder stage ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Payload types before building
RUN npm run generate:types || true

ENV NODE_ENV=production
RUN npx turbo run build --filter=@suzanne/payload

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
