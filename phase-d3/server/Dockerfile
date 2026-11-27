# PharmLedger sync back end, Sydney (Fly.io syd). SQLite on the /data volume, streamed to S3 ap-southeast-2 by Litestream.
FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npx esbuild src/index.ts --bundle --platform=node --target=node22 --format=esm --outfile=dist/server.mjs

FROM node:22-bookworm-slim
ARG LITESTREAM_VERSION=0.3.13
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini ca-certificates curl \
 && curl -fsSL -o /tmp/litestream.deb "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.deb" \
 && dpkg -i /tmp/litestream.deb && rm /tmp/litestream.deb \
 && apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid app --home /app --shell /usr/sbin/nologin app \
 && mkdir -p /data /app/dist && chown -R app:app /data /app
WORKDIR /app
COPY --from=build --chown=app:app /src/dist/server.mjs /app/dist/server.mjs
COPY --chown=app:app litestream.yml /etc/litestream.yml
ENV NODE_ENV=production PORT=8080 DB_PATH=/data/pharmledger.db
USER app
VOLUME ["/data"]
EXPOSE 8080
# Restore the latest replica on a fresh volume, then run the server under Litestream replication.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "litestream restore -if-db-not-exists -if-replica-exists -config /etc/litestream.yml /data/pharmledger.db && exec litestream replicate -config /etc/litestream.yml -exec \"node /app/dist/server.mjs\""]
