# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY apps/medusa/package.json ./apps/medusa/

# --force overrides all peer-dependency conflicts (stronger than --legacy-peer-deps)
RUN cd apps/medusa && npm install --force

# Confirm the medusa CLI binary exists before attempting build
RUN ls apps/medusa/node_modules/.bin/medusa && \
    echo "✓ medusa binary found" || \
    (echo "✗ medusa binary MISSING — install failed" && exit 1)

# Copy source and build
COPY apps/medusa/ ./apps/medusa/
RUN cd apps/medusa && node_modules/.bin/medusa build

# Confirm build output exists before moving to runner stage
RUN ls apps/medusa/.medusa/server/index.js && \
    echo "✓ .medusa/server built" || \
    (echo "✗ .medusa/server not found — build produced no output" && exit 1)

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
