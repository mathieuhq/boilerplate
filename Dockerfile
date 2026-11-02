# syntax=docker/dockerfile:1

ARG NODE_VERSION=26
ARG ALPINE_VERSION=3.24

FROM docker.io/library/node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS node

FROM node AS node-binary
RUN apk add --no-cache binutils \
    && strip --strip-all /usr/local/bin/node

FROM docker.io/library/alpine:${ALPINE_VERSION} AS slim
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
    --exclude=**/@prisma/dev/dist/runtime-assets \
    --exclude=**/@prisma/query-plan-executor \
    --exclude=**/@prisma/streams-local \
    --exclude=**/@radix-ui \
    --exclude=**/@types \
    --exclude=**/@visx \
    --exclude=**/elkjs \
    --exclude=**/react \
    --exclude=**/react-dom \
    --exclude=**/query_compiler_*.cockroachdb.* \
    --exclude=**/query_compiler_*.mysql.* \
    --exclude=**/query_compiler_*.sqlite.* \
    --exclude=**/query_compiler_*.sqlserver.* \
    --exclude=**/metafile-*.json \
    --exclude=**/*.map \
    --exclude=**/*.d.ts \
    --exclude=**/*.d.mts \
    --exclude=**/*.d.cts \
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
