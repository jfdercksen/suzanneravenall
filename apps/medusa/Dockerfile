# Medusa v2 — single-stage build
#
# How Medusa v2 works:
# - `medusa build` compiles the admin UI into .medusa/server/public/admin/
# - The server runtime loads TypeScript source via ts-node (not precompiled JS)
# - The server expects the admin build at ./public/admin/ (ADMIN_RELATIVE_OUTPUT_DIR)
#
# Therefore this image needs:
# 1. All deps including ts-node (devDependency needed at runtime)
# 2. The TypeScript source files (src/)
# 3. The admin build at /app/public/admin/ (copied from .medusa/server/public/admin/)
# 4. medusa-config.js

FROM node:20-alpine

WORKDIR /app

# Copy manifests first for layer-caching
COPY apps/medusa/package.json apps/medusa/package-lock.json* ./

# Install all deps (including ts-node devDependency needed at runtime)
RUN npm install --force

# Copy source and config
COPY apps/medusa/ .

# Build the admin UI (output goes to .medusa/server/public/admin/)
# DATABASE_URL is not used at build time — Medusa reads config but does not connect
RUN DATABASE_URL=postgres://build:build@localhost:5432/build \
    node_modules/.bin/medusa build

# Move the admin build to where the server expects it: ./public/admin/
RUN mkdir -p ./public && cp -r .medusa/server/public/admin ./public/admin

EXPOSE 9000

ENV NODE_ENV=production

CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
