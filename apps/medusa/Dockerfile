# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY apps/medusa/package.json ./apps/medusa/
RUN cd apps/medusa && npm install --legacy-peer-deps

# Debug: confirm what medusa binary is available post-install
RUN echo "=== .bin ===" && ls apps/medusa/node_modules/.bin/ | grep -i medusa || echo "NO MEDUSA IN .BIN" && \
    echo "=== @medusajs packages ===" && ls apps/medusa/node_modules/@medusajs/ 2>/dev/null || echo "NO @medusajs DIR"

# Copy source and build
COPY apps/medusa/ ./apps/medusa/
RUN cd apps/medusa && node_modules/.bin/medusa build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

# Install production dependencies fresh (avoids devDeps and native binary issues)
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled server output
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/.medusa/server ./

USER medusa

EXPOSE 9000

CMD ["node", "index.js"]
