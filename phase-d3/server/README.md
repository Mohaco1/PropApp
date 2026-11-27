# PharmLedger sync back end (D3-B)

Sydney (Fly.io `syd`, SES and S3 in `ap-southeast-2`). Node 22 built-ins only: `node:sqlite`, `node:crypto`, `node:http`.
Not deployed: deploying needs the owner's go-ahead.

- Build: `npm run build` (esbuild → `dist/server.mjs`). Test: `node app/tests/d3-server.js` from the repo root.
- Secrets: `EMAIL_INDEX_HMAC_KEY`, `LOG_HMAC_KEY` (distinct, 32+ chars), `MAIL_FROM`, `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY`, `LITESTREAM_S3_BUCKET`, `LITESTREAM_ACCESS_KEY_ID`, `LITESTREAM_SECRET_ACCESS_KEY`.
- On disk: no emails (HMAC blind index only), no IPs, no raw magic or session tokens (SHA-256 only).
- Topic wording (`src/topics.ts`) is taken from the app's checked content in `app/src/content/`; change it there first.

| Endpoint | Result |
|---|---|
| `GET /v1/healthz` | 200 `{ ok, region, sqlite, ts }` |
| `POST /v1/auth/magic-link` | 202 `{ accepted, expiresInSec: 900 }`; 429 + `Retry-After` (3/900 s per email, 10/900 s per IP) |
| `POST /v1/auth/verify` | 200 `{ sessionToken, accountId, expiresAt }`; 401 used, expired or unknown |
| `POST /v1/auth/logout` | 204; 401 without a live token |
| `GET/POST /v1/sync/:pharmacyId` | Bearer; `{ baseRev, pharmacy, deletedAt }`; 200, idempotent 200, 409 with the server head |
| `GET /v1/topics/:topicId` | 200 + SHA-256 `ETag`; 304; 404 |
