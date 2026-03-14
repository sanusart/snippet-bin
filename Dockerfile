FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm -r build


FROM node:24-alpine

RUN apk add --no-cache dumb-init nginx git

WORKDIR /app

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/.env.example ./server/.env

WORKDIR /app/server

# Replace workspace: protocol with file: for production
RUN sed -i 's/"workspace:\*"/"file:..\/shared"/' /app/server/package.json

RUN npm install --omit=dev --legacy-peer-deps

COPY nginx-prod.conf /etc/nginx/nginx.conf

RUN mkdir -p /app/server/data /var/cache/nginx /var/run /var/log/nginx /var/lib/nginx/logs /var/lib/nginx/tmp

RUN touch /var/log/nginx/error.log /var/log/nginx/access.log && \
    chown -R node:node /var/log/nginx /var/lib/nginx/logs /var/lib/nginx/tmp /app/server/data

EXPOSE 3001 80

ENV NODE_ENV=production

# Run as root for nginx, then switch to node for server
USER root

CMD ["dumb-init", "--", "/bin/sh", "-c", \
     "nginx -g 'daemon off;' & \
      su -s /bin/sh -c 'cd /app/server && node dist/index.js' node"]
