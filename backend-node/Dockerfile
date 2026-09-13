FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

RUN npm prune --omit=dev \
    && addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app

USER app
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]
