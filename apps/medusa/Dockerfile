# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (devDeps needed for build)
COPY apps/medusa/package.json ./
RUN npm install --force

# Copy source and build — produces .medusa/server/ with compiled bundle + package.json
COPY apps/medusa/ .
RUN node_modules/.bin/medusa build

# Diagnostic: show exactly what the build produced
RUN echo "=== medusa build output ===" && find /app/.medusa -maxdepth 5 2>/dev/null | sort || echo "WARNING: .medusa dir not created"

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -S medusa && adduser -S medusa -G medusa

# The WORKDIR IS the server bundle — copy .medusa/server/ directly here
WORKDIR /app

# .medusa/server/ has its own package.json with predeploy + start scripts
COPY --from=builder --chown=medusa:medusa /app/.medusa/server ./

# Install production deps from the bundle's own package.json (not the source one)
RUN npm install --force && chown -R medusa:medusa /app

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

# predeploy = medusa db:migrate (creates all entity + link tables)
# start     = medusa start
CMD ["sh", "-c", "npm run predeploy && npm run start"]
