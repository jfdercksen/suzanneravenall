# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Context is the monorepo root (set in docker-compose: context: ..)
FROM node:20-alpine AS builder

WORKDIR /server

# Install all deps (dev included — needed for medusa build)
COPY apps/medusa/package.json ./
RUN npm install --force

# Copy source and build
COPY apps/medusa/ .

RUN node_modules/.bin/medusa build

# Compile medusa-config.ts → medusa-config.js so the runner doesn't need ts-node
RUN node_modules/.bin/tsc medusa-config.ts \
    --target ES2021 \
    --module CommonJS \
    --moduleResolution node \
    --esModuleInterop \
    --skipLibCheck \
    --outDir /server

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /server

# Built bundle + compiled config + package.json
COPY --from=builder --chown=medusa:medusa /server/.medusa ./.medusa
COPY --from=builder --chown=medusa:medusa /server/medusa-config.js ./
COPY --from=builder --chown=medusa:medusa /server/package.json ./

# Production deps only — no ts-node, no dashboard build tools
RUN npm install --omit=dev --force && chown -R medusa:medusa /server

# Startup script
COPY --chown=medusa:medusa apps/medusa/start.sh ./
RUN chmod +x start.sh

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

CMD ["./start.sh"]
