FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY apps/web-2/package.json apps/web-2/package.json
RUN pnpm install --filter @mmsc/web-2... --filter @mmsc/web... --frozen-lockfile
COPY apps/web apps/web
COPY apps/web-2 apps/web-2
ARG VITE_API_URL=http://localhost:14000/api/v1
ARG VITE_MAIN_APP_URL=http://localhost:15173
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAIN_APP_URL=$VITE_MAIN_APP_URL
RUN pnpm --filter @mmsc/web-2 build
FROM nginx:1.27-alpine
COPY --from=build /app/apps/web-2/dist /usr/share/nginx/html
COPY apps/web-2/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
