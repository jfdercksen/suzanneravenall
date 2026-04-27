# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY apps/medusa/package.json ./apps/medusa/

# --force overrides all peer-dependency conflicts
RUN cd apps/medusa && npm install --force

# Copy source and build
COPY apps/medusa/ ./apps/medusa/

RUN cd apps/medusa && node_modules/.bin/medusa build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

# Package manifest and config
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/package.json ./
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/medusa-config.js ./

# Install production dependencies and transfer ownership to the non-root user
RUN npm install --omit=dev --force && chown -R medusa:medusa /app

# Backend compiled output (tsc → dist/)
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/dist ./dist

# Admin dashboard + type bindings (.medusa/client/, .medusa/types/)
COPY --from=builder --chown=medusa:medusa /app/apps/medusa/.medusa ./.medusa

USER medusa

EXPOSE 9000

ENV NODE_ENV=production
CMD ["node_modules/.bin/medusa", "start"]
