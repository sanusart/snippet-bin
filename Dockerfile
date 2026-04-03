FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm -r build


FROM node:24-alpine

RUN apk add --no-cache dumb-init git

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

RUN mkdir -p /app/server/data && \
    chown -R node:node /app/server/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001 8080

USER node

CMD ["node", "dist/index.js"]
