# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies (layer-cached unless package.json changes)
COPY apps/medusa/package.json ./
RUN npm install --force

# Copy source and build
COPY apps/medusa/ .

RUN node_modules/.bin/medusa build

# Diagnostic: show exactly what medusa build produced so we know the structure
RUN echo "=== .medusa contents ===" && find .medusa/ -maxdepth 3 2>/dev/null || echo "no .medusa dir"

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

COPY --from=builder --chown=medusa:medusa /build/package.json ./
COPY --from=builder --chown=medusa:medusa /build/.medusa ./.medusa

RUN npm install --omit=dev --force && chown -R medusa:medusa /app

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
