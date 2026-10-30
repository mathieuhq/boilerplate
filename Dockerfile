# syntax=docker/dockerfile:1

ARG NODE_VERSION=26

# node:X-alpine can lag a few days behind alpine:latest after an Alpine release;
# its Node binary still runs on the newer one
FROM docker.io/library/node:${NODE_VERSION}-alpine AS node

# Bare Alpine with only the Node binary: no npm, yarn or corepack in shipped images
FROM docker.io/library/alpine:latest AS slim
RUN apk add --no-cache libstdc++ \
    && addgroup -g 1000 node \
    && adduser -D -u 1000 -G node node
COPY --from=node /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production
WORKDIR /app

FROM node AS build
ENV PNPM_HOME=/pnpm \
    HUSKY=0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Node 25+ no longer ships corepack: install the pnpm version pinned in packageManager
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    npm install --global --no-audit --no-fund "$(node -p "require('./package.json').packageManager.split('+')[0]")" \
    && pnpm install --frozen-lockfile
COPY . .
# prisma.config.ts requires DATABASE_URL, even though generate never connects
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm prisma generate \
    && pnpm build

# Only the Prisma CLI (and dotenv for prisma.config.ts), at the versions pinned in
# package.json. Its install scripts download the schema engine used by migrations.
FROM node AS migrate-deps
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node -e "const { dependencies, devDependencies } = require('/tmp/package.json'); const versions = { ...dependencies, ...devDependencies }; require('fs').writeFileSync('package.json', JSON.stringify({ private: true, dependencies: { prisma: versions.prisma, dotenv: versions.dotenv }, allowScripts: { prisma: true, '@prisma/engines': true } }));" \
    && npm install --omit=dev --no-audit --no-fund

# One-off job: applies pending migrations, then exits
FROM slim AS migrate
ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1
# Only used by prisma studio and prisma dev, never loaded by migrate deploy (~53 MB saved)
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

# Nitro traces server dependencies into .output, so node_modules is not shipped
FROM slim AS runtime
ENV HOST=0.0.0.0 \
    PORT=3000
# pnpm installs both libc variants of sharp; Alpine only loads the linuxmusl ones (~18 MB saved)
COPY --from=build \
    --exclude=**/@img/sharp-linux-* \
    --exclude=**/@img/sharp-libvips-linux-* \
    /app/.output ./.output
# Read at runtime by lib/changelog.ts
COPY --from=build /app/changelogs ./changelogs
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
