# syntax=docker/dockerfile:1

FROM docker.io/library/node:alpine AS node

FROM node AS node-binary
RUN apk add --no-cache binutils \
    && strip --strip-all /usr/local/bin/node

FROM docker.io/library/alpine:latest AS slim
RUN apk add --no-cache libstdc++ libatomic \
    && addgroup -g 1000 node \
    && adduser -D -u 1000 -G node node
COPY --from=node-binary /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production
WORKDIR /app

FROM node AS build
ENV PNPM_HOME=/pnpm \
    HUSKY=0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    npm install --global --no-audit --no-fund "$(node -p "require('./package.json').packageManager.split('+')[0]")" \
    && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node AS migrate-deps
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node -e "const { dependencies } = require('/tmp/package.json'); require('fs').writeFileSync('package.json', JSON.stringify({ private: true, type: 'module', dependencies: { 'drizzle-orm': dependencies['drizzle-orm'], pg: dependencies.pg } }));" \
    && npm install --omit=dev --omit=peer --no-audit --no-fund

FROM slim AS migrate
COPY --from=migrate-deps \
    --exclude=**/*.map \
    --exclude=**/*.d.ts \
    --exclude=**/*.d.cts \
    /app/node_modules ./node_modules
COPY --from=migrate-deps /app/package.json ./
COPY drizzle ./drizzle
USER node
CMD ["node", "drizzle/migrate.ts"]

FROM slim AS runtime
ENV HOST=0.0.0.0 \
    PORT=3000
COPY --from=build \
    --exclude=**/@img/sharp-linux-* \
    --exclude=**/@img/sharp-libvips-linux-* \
    /app/.output ./.output
COPY --from=build /app/changelogs ./changelogs
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
