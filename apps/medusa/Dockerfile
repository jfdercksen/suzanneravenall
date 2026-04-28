FROM node:20-alpine

WORKDIR /app

COPY apps/medusa/package.json ./
RUN npm install --force

COPY apps/medusa/ .

EXPOSE 9000

ENV NODE_ENV=production

CMD ["sh", "-c", "node_modules/.bin/medusa db:migrate && node_modules/.bin/medusa start"]
