# syntax=docker/dockerfile:1

ARG NODE_VERSION=26

FROM docker.io/library/node:${NODE_VERSION}-alpine AS node

FROM docker.io/library/alpine:latest AS slim
RUN apk add --no-cache libstdc++ \
    && addgroup -g 1000 node \
    && adduser -D -u 1000 -G node node
COPY --from=node /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production
WORKDIR /app

FROM node AS dev
ENV PNPM_HOME=/pnpm \
    npm_config_store_dir=/pnpm/store \
    HUSKY=0
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm install --global --no-audit --no-fund "$(node -p "require('/tmp/package.json').packageManager.split('+')[0]")"
EXPOSE 3000
CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm prisma generate && pnpm exec vite dev --host 0.0.0.0"]

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
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm prisma generate \
    && pnpm build

FROM node AS migrate-deps
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node -e "const { dependencies, devDependencies } = require('/tmp/package.json'); const versions = { ...dependencies, ...devDependencies }; require('fs').writeFileSync('package.json', JSON.stringify({ private: true, dependencies: { prisma: versions.prisma, dotenv: versions.dotenv }, allowScripts: { prisma: true, '@prisma/engines': true } }));" \
    && npm install --omit=dev --no-audit --no-fund

FROM slim AS migrate
ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1
COPY --from=migrate-deps \
    --exclude=**/@electric-sql \
    --exclude=**/@radix-ui \
    --exclude=**/@types \
    --exclude=**/@visx \
    --exclude=**/elkjs \
    --exclude=**/react \
    --exclude=**/react-dom \
    /app/node_modules ./node_modules
COPY prisma.config.ts ./
COPY prisma ./prisma
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

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
