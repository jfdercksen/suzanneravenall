# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
# medusa build outputs a self-contained server bundle to .medusa/server/
FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies (layer-cached unless package.json changes)
COPY apps/medusa/package.json ./
RUN npm install --force

# Copy source and build
COPY apps/medusa/ .

RUN node_modules/.bin/medusa build

# Fail fast if medusa build did not produce the expected output
RUN test -d .medusa/server || (echo "ERROR: medusa build did not create .medusa/server/" && exit 1)

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

# .medusa/server IS the self-contained built application — copy its contents
# into WORKDIR so medusa db:migrate and medusa start resolve modules correctly
COPY --from=builder --chown=medusa:medusa /build/.medusa/server ./

# Install production dependencies inside the built bundle
RUN npm install --omit=dev --force && chown -R medusa:medusa /app

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

# Run pending migrations on every start (idempotent), then start the server.
# Migrations MUST run from inside .medusa/server/ (WORKDIR /app) so that all
# Medusa modules are fully resolved — running from project root only resolves
# link modules and skips entity module migrations (api_key, product, order, etc.)
CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
