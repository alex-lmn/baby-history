FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,id=npm-backend,target=/root/.npm \
    npm ci --omit=dev --no-fund --no-audit

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
