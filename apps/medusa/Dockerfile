FROM node:20-alpine

RUN addgroup -S medusa && adduser -S medusa -G medusa

WORKDIR /app

COPY apps/medusa/package.json ./
RUN npm install --force && chown -R medusa:medusa /app

COPY --chown=medusa:medusa apps/medusa/ .

USER medusa

EXPOSE 9000

ENV NODE_ENV=production

CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
