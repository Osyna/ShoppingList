# syntax=docker/dockerfile:1.7

# ------------------------------------------------------------
# Stage 1 — build the static Vite bundle.
# ------------------------------------------------------------
FROM node:22-alpine AS builder

ENV NODE_ENV=production \
    CI=true \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

WORKDIR /app

# Install deps with a persistent npm cache so rebuilds skip the tarball fetch.
# devDependencies are required for `vite build` and `vue-tsc`, so we install
# the full dep set and prune nothing (this stage is thrown away).
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --prefer-offline --no-audit --no-fund

# Copy the source after deps so code-only edits hit the npm cache.
COPY . .

# Backend URL is baked in at build time (Vite inlines import.meta.env.*).
# Required: pass `--build-arg VITE_PB_URL=...` (Dokploy build args).
ARG VITE_PB_URL
ENV VITE_PB_URL=${VITE_PB_URL}
RUN test -n "$VITE_PB_URL" || (echo "VITE_PB_URL build arg is required" >&2 && exit 1)

RUN npm run build

# ------------------------------------------------------------
# Stage 2 — serve the built assets with nginx.
# ------------------------------------------------------------
FROM nginx:1.27-alpine-slim AS runner

# Drop nginx's default vhost so ours is the only one.
RUN rm -f /etc/nginx/conf.d/default.conf

# Same ARG is re-declared per stage. Used to bake PB origin/host into the
# CSP header so the runtime image doesn't need extra env wiring.
ARG VITE_PB_URL
RUN test -n "$VITE_PB_URL" || (echo "VITE_PB_URL build arg is required" >&2 && exit 1)

COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Substitute CSP placeholders: ${PB_ORIGIN} → full URL, ${PB_HOST} → host only.
RUN PB_ORIGIN="$VITE_PB_URL" && \
    PB_HOST="$(printf '%s' "$VITE_PB_URL" | sed -E 's|^https?://||; s|/.*$||')" && \
    sed -i "s|\${PB_ORIGIN}|$PB_ORIGIN|g; s|\${PB_HOST}|$PB_HOST|g" /etc/nginx/conf.d/app.conf

EXPOSE 80

# nginx:alpine already defaults to `nginx -g 'daemon off;'` with proper
# signal handling, so no custom CMD is needed.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz || exit 1
