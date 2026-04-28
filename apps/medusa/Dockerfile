# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (devDeps needed for ts-node during build)
COPY apps/medusa/package.json ./
RUN npm install --force

# Copy source and build — produces .medusa/server/ with compiled entity modules
COPY apps/medusa/ .

RUN node_modules/.bin/medusa build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

# Copy built bundle and package.json from builder
COPY --from=builder --chown=medusa:medusa /app/.medusa ./.medusa
COPY --from=builder --chown=medusa:medusa /app/package.json ./

# Install production deps at root level so CLI is available
RUN npm install --omit=dev --force && chown -R medusa:medusa /app

# Symlink node_modules into .medusa/server so entity module packages are resolvable
RUN ln -s /app/node_modules /app/.medusa/server/node_modules

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

# Run migrations and start from inside .medusa/server/ where entity bundles live
CMD ["sh", "-c", "cd .medusa/server && node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
