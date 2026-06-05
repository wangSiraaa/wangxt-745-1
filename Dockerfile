FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm run build:server

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV API_PORT=3001

EXPOSE 3000 3001

CMD ["node", "api/dist/app.js"]
