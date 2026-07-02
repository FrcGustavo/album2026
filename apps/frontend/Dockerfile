FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile --filter @album/frontend...

COPY apps/frontend ./apps/frontend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /app/apps/frontend
RUN pnpm build

FROM nginx:1.29-alpine

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
