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
# Ensure workspace-local node_modules dir exists so the COPY in builder never fails
RUN mkdir -p apps/payload/node_modules

# ── Builder stage ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
# Copy root node_modules (hoisted packages) AND workspace-local node_modules.
# In a partial-workspace Docker build npm may install some packages (e.g.
# @payloadcms/next) into apps/payload/node_modules instead of hoisting them
# to the root. Copying both ensures Next.js can resolve every import.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/payload/node_modules ./apps/payload/node_modules
COPY . .

# Dummy build-time values — pg throws "Invalid URL" if DATABASE_URL is unset
# when withPayload() imports payload.config.ts. Not copied into the runner stage.
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/payload_build
ENV PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime
ENV PAYLOAD_URL=http://localhost:3001/cms

RUN npx turbo run build --filter=@suzanne/payload
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
