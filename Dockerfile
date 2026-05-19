# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_API_BASE=
ARG VITE_LIVEKIT_URL
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_LIVEKIT_URL=${VITE_LIVEKIT_URL}
RUN npm run build

FROM node:20-bookworm-slim AS agent-base
WORKDIR /app/agent

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY agent/package.json agent/package-lock.json ./
RUN npm ci --omit=dev

COPY agent/ ./
COPY config.json /app/config.json

FROM agent-base AS web
WORKDIR /app/agent

COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
ENV SERVE_FRONTEND=1

EXPOSE 8000

COPY docker/entrypoint-web.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:8000/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]

FROM agent-base AS agent
WORKDIR /app/agent

ENV NODE_ENV=production

CMD ["node", "agent.js", "start"]
