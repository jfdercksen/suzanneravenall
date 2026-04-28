FROM node:20-alpine

RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

COPY apps/medusa/package.json ./
RUN npm install --force

COPY apps/medusa/ .
RUN chown -R medusa:medusa /app

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

# Run migrations then start. With defineConfig, db:migrate registers all core
# modules and creates entity tables (product, order, customer, api_key, etc.)
CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
