# Context is the monorepo root (set in docker-compose: context: ..)
# No build step — Medusa runs directly from source via ts-node (no custom modules to bundle)
FROM node:20-alpine

RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /server

# Install all deps including devDeps (ts-node required to load medusa-config.ts at runtime)
COPY apps/medusa/package.json ./
RUN npm install --force && chown -R medusa:medusa /server

COPY --chown=medusa:medusa apps/medusa/ .

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
