# KalpZero Enterprise API

This FastAPI service is the canonical backend for platform core, Wave 1 domain
packs, import orchestration, publishing, and AI governance. The API is designed
to fail startup on weak or missing secrets and to deny access when permission
definitions are absent.

Local notes:

- use `pnpm dev:api:local` from the repo root for SQLite + memory-doc mode
- use `pnpm dev:api:infra` from the repo root for Postgres + Mongo + Redis mode
- the repo-root `.env` is the only environment file used at runtime
- Postgres URLs should prefer `postgresql+psycopg://...`
