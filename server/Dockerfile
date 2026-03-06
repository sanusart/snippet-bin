FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter ./shared build
RUN pnpm --filter ./server build
RUN pnpm --filter ./server --prod deploy --legacy /prod/server

FROM node:24-alpine

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache git

COPY --from=builder /prod/server /app

RUN mkdir -p data

EXPOSE 3001

CMD ["pnpm", "start"]
