FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/medusa/package.json ./
RUN npm install --force

COPY apps/medusa/ .

# Build admin UI and server bundle
# DATABASE_URL is not used during build but medusa build reads config
RUN DATABASE_URL=postgres://build:build@localhost:5432/build \
    node_modules/.bin/medusa build

# ---------------------------------------------------------------------------

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.medusa/server ./

RUN npm install --production --force

EXPOSE 9000

ENV NODE_ENV=production

CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
