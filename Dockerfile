FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY data/ ./data/

RUN npm run build

# Store the SQLite database in a volume
VOLUME /app/db

ENV DB_PATH=/app/db/loldle.db

CMD ["node", "dist/index.js"]
