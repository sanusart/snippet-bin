FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm -r build


FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache dumb-init nginx git

WORKDIR /app

COPY --from=builder /app/server/dist /app/server
COPY --from=builder /app/client/dist /app/client
COPY --from=builder /app/server/package.json /app/server/
COPY --from=builder /app/server/.env.example /app/server/.env
COPY nginx-prod.conf /etc/nginx/nginx.conf

RUN mkdir -p /app/server/data /var/cache/nginx /var/run

EXPOSE 3001 80

ENV NODE_ENV=production

USER node

CMD ["dumb-init", "--", "/bin/sh", "-c", \
     "nginx -c /etc/nginx/nginx.conf & \
      cd /app/server && pnpm start"]
