# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY apps/medusa/package.json ./apps/medusa/

# --force overrides all peer-dependency conflicts (stronger than --legacy-peer-deps)
RUN cd apps/medusa && npm install --force

# Copy source and build
COPY apps/medusa/ ./apps/medusa/
RUN cd apps/medusa && npm exec -- medusa build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

# Install production dependencies fresh (avoids devDeps and native binary issues)
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/package.json ./
RUN npm install --omit=dev --force

# Copy compiled server output
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/.medusa/server ./

USER medusa

EXPOSE 9000

CMD ["node", "index.js"]
