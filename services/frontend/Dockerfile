# syntax=docker/dockerfile:1.4

# ---- Build stage -----------------------------------------------------------
FROM cgr.dev/chainguard/node:latest-dev AS build
WORKDIR /app

# Install frontend dependencies first to leverage Docker layer caching
COPY photo-site/package*.json ./
RUN npm ci

# Copy the remaining source and produce the production bundle
COPY photo-site/ ./
RUN npm run build

# ---- Runtime stage ---------------------------------------------------------
FROM cgr.dev/chainguard/busybox:latest AS busybox

FROM cgr.dev/chainguard/nginx:latest

# Install a minimal busybox so the entrypoint script has a POSIX shell available
COPY --from=busybox /bin/busybox /bin/busybox

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
