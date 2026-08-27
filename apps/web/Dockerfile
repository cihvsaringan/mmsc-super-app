FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter @mmsc/web... --frozen-lockfile
COPY apps/web apps/web
ARG VITE_API_URL=http://localhost:14000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @mmsc/web build
FROM nginx:1.27-alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
