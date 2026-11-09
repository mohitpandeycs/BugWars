FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY src ./src
COPY data ./data

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]