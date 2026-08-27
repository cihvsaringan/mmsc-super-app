FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @mmsc/api... --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter @mmsc/api build
EXPOSE 14000
CMD ["pnpm", "--filter", "@mmsc/api", "start"]
