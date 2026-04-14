# KalpZero Enterprise

KalpZero Enterprise is the canonical rebuild of KalpZero as an enterprise-grade,
multi-tenant operating platform for vertical businesses. The existing repository
is treated as `legacy-reference` only and is used for extraction, mapping, and
concept migration.

## Product Direction

- Canonical frontend: Next.js operator console and public publishing in
  `apps/web`
- Canonical backend: FastAPI domain API in `apps/api`
- Background processing: import, publishing, notifications, indexing, and AI
  ingestion in `apps/worker`
- Shared contracts and UI foundations in `packages/*`
- Decision-grade architecture and delivery docs in `docs/*`

## Blueprint Runtime

KalpZero Enterprise does not fork the product into a separate codebase for
every tenant. Instead, the public site, admin shell, and future mobile surfaces
are driven by a shared `Business Blueprint` contract plus runtime documents.

- `Business Blueprint`: vocabulary, enabled modules, navigation, routes, theme
  tokens, dashboard widgets, and mobile capabilities
- Runtime documents: page content, discovery documents, AI knowledge, and other
  flexible tenant-authored payloads
- Common API: FastAPI remains the authority for tenancy, permissions, vertical
  data, and publishing contracts
- Flexible delivery: standard tenants use theme tokens and component registries;
  enterprise tenants can receive vetted extensions without breaking the common
  platform

## Wave 1

Wave 1 targets India-first enterprise execution for:

- eCommerce
- Tour & Travels
- Hotels Management

The platform is designed so later vertical packs can extend the same core:

- Real Estate
- Doctor Clinic Management
- Single Doctor Website
- School Management System
- LMS

## Principles

- Fail closed for authorization, feature access, and tenant boundary checks
- Mandatory runtime env validation, with no default secrets
- Shared control plane with tenant-scoped runtime and optional dedicated infra
- Canonical data contracts before migration
- Legacy systems integrated by one-way import and synchronization, not dual-write
- Tenant onboarding is gated by platform readiness checks and approved vertical
  support, not just by API reachability

## Storage Model

KalpZero Enterprise uses a hybrid 3-layer data model:

- Control plane and transactional source of truth: Postgres
- Runtime documents, content, AI knowledge, and import staging: MongoDB
- Cache, queue, and operational coordination: Redis

This keeps financial and workflow-critical domains relational while preserving
MongoDB for flexible business documents and staged imports.

## Workspace Layout

- `apps/web`: Next.js operator app and public publishing shell
- `apps/api`: FastAPI platform API and Wave 1 domain services
- `apps/worker`: background job runner and import pipeline workers
- `packages/contracts`: DTOs, registry contracts, and event types
- `packages/ui`: shared design system and shell components
- `packages/config`: lint, TypeScript, Python, and env templates
- `adapters/legacy-kalpzero`: mappings from the current KalpZero repo
- `adapters/external-sources`: mappings for external project databases
- `docs`: architecture, vertical specs, runbooks, and roadmap

## Start Here After A Gap

Before resuming development, read:

- `EXECUTION_TRACKER.md`
- `docs/15_HOTEL_VERTICAL_STATUS.md`
- `docs/17_EXTENDED_ECOMMERCE_VERTICAL_PLAN.md`
- `docs/12_EXECUTION_ROADMAP_90_DAYS.md`

## Current Implemented Surfaces

- SQL-backed platform control plane, tenancy, audit, and import job framework
- Wave 1 commerce, travel, and hotel transactional packs
- Mongo-backed publishing blueprint, page runtime, and discovery runtime
- Onboarding readiness reporting and fail-closed tenant provisioning for
  approved pilot verticals only
- Tenant onboarding now provisions a tenant-scoped Mongo runtime database,
  creates the baseline runtime collections, and seeds the first blueprint,
  public pages, and discovery documents
- Commerce now includes catalog governance, pricing, tax, payments, refunds,
  invoice issuance, warehouse stock, stock ledger, fulfillments, and shipments
- Hotel essentials now include meal plans, guest profiles, late room assignment,
  richer reservation fields, split operational room state, rate plans,
  availability rules, folios, payments, refunds, invoice issuance, staff
  scheduling, night audit, stay records, room moves, guest documents, public
  hotel content, and summary reporting
- Public tenant route rendering in
  `apps/web/app/[tenantSlug]/[[...pageSlug]]/page.tsx`
- Admin shell blueprint preview in
  `apps/web/app/studio/[tenantSlug]/page.tsx`
- Super Admin and tenant admin shells now live in
  `apps/web/app/platform/page.tsx`,
  `apps/web/app/platform/onboarding/page.tsx`,
  `apps/web/app/platform/operations/page.tsx`,
  `apps/web/app/tenant/page.tsx`, and
  `apps/web/app/login/page.tsx`

## Path Convention

This README uses `REPO_ROOT` for the local clone directory. Set it once after
cloning:

```bash
git clone https://github.com/hideepakrai/kalpzero-enterprise.git
cd kalpzero-enterprise
export REPO_ROOT="$(pwd)"
```

If you already cloned the repo elsewhere, just `cd` into it and export the same
variable:

```bash
cd /path/to/kalpzero-enterprise
export REPO_ROOT="$(pwd)"
```

## Setup

Run these first:

```bash
cd "$REPO_ROOT"
pnpm install --frozen-lockfile
cd apps/api
python3 -m venv .venv
./.venv/bin/pip install -e ".[dev]"
```

What they do:

- `pnpm install --frozen-lockfile`: installs the JS workspace exactly from the lockfile
- `python3 -m venv .venv`: creates the API virtual environment if it does not exist yet
- `./.venv/bin/pip install -e ".[dev]"`: installs the FastAPI app plus `pytest` and local dev dependencies

## Local Setup Order

Follow this exact order on a fresh local setup:

```bash
cd "$REPO_ROOT"
pnpm install --frozen-lockfile
cd apps/api
python3 -m venv .venv
./.venv/bin/pip install -e ".[dev]"
cd ..
cd ..
pnpm doctor:local
```

If `pnpm doctor:local` reports missing local services, install and start them:

```bash
brew install postgresql@16 redis
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start postgresql@16
brew services start redis
brew services start mongodb-community@8.0
createdb kalpzero_enterprise
pnpm doctor:local
```

The local API env is already configured in
[`apps/api/.env`](apps/api/.env) for the Homebrew local path:

- Postgres: `postgresql+psycopg:///kalpzero_enterprise`
- MongoDB: `mongodb://localhost:27017`
- Redis: `redis://localhost:6379/0`

## Local Doctor

Run this before trying the full local infra path:

```bash
cd "$REPO_ROOT"
pnpm doctor:local
```

It checks:

- `apps/api/.env`
- the API virtualenv
- Python modules required by the backend
- local `psql`, `redis-cli`, and `mongosh` availability
- live Postgres, Redis, and Mongo connections when those tools exist

## Run Commands

### Quick Local API

This is the fastest verified way to boot the API locally without Postgres,
MongoDB, or Redis running yet. It uses SQLite and in-memory runtime docs only
for local development.

```bash
cd "$REPO_ROOT"
pnpm dev:api:local
```

Verified result:

- API starts on `http://127.0.0.1:8010`
- `GET /health/live` returns `{"status":"ok"}`

### API With Real Infra

For onboarding-grade behavior, copy the env template and point it at real
services:

```bash
cd "$REPO_ROOT"
cp .env.example apps/api/.env
```

The repo now expects the psycopg v3 driver path for Postgres:

- preferred local Homebrew form: `postgresql+psycopg:///kalpzero_enterprise`
- explicit host form: `postgresql+psycopg://YOUR_LOCAL_USER@localhost:5432/kalpzero_enterprise`
- tolerated: `postgresql://...` and `postgres://...` are auto-normalized by the API

If you want full local infra without Docker, install the
services with Homebrew:

```bash
brew install postgresql@16 redis
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start postgresql@16
brew services start redis
brew services start mongodb-community@8.0
createdb kalpzero_enterprise
```

Then run:

```bash
cd "$REPO_ROOT"
pnpm dev:api:infra
```

Then verify:

```bash
curl http://127.0.0.1:8000/health/live
curl http://127.0.0.1:8000/health/ready
```

### One Command Super Admin Bootstrap

This is the fastest way to get the Super Admin UI running locally:

```bash
cd "$REPO_ROOT"
pnpm super-admin:start
```

What it does:

- installs workspace dependencies if needed
- creates the API virtualenv if needed
- runs `pnpm doctor:local`
- starts the FastAPI backend on `http://127.0.0.1:8000` if it is not already running
- starts the Next.js web app on `http://127.0.0.1:3000` if available, otherwise the next free local port
- seeds `demo-agency` and `demo-tenant` if they do not already exist
- opens the login page automatically on macOS when possible
- keeps the terminal attached to any services it started; press `Ctrl-C` to stop them

Default sign-ins after bootstrap:

- Super Admin: `founder@kalpzero.com` / `very-secure-password`
- Tenant Admin: `ops@tenant.com` / `very-secure-password` with tenant slug `demo-tenant`

### Backend Onboarding Smoke Flow

Use this against `pnpm dev:api:infra` to verify the pilot onboarding path.

Create a platform token:

```bash
PLATFORM_TOKEN=$(curl -s http://127.0.0.1:8000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"founder@kalpzero.com","password":"very-secure-password"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')
```

Create an agency:

```bash
curl -s http://127.0.0.1:8000/platform/agencies \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"slug":"demo-agency","name":"Demo Agency","region":"in","owner_user_id":"founder@kalpzero.com"}'
```

Create a tenant and inspect the runtime database bootstrap:

```bash
curl -s http://127.0.0.1:8000/platform/tenants \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"agency_slug":"demo-agency","slug":"demo-tenant","display_name":"Demo Tenant","infra_mode":"shared","vertical_packs":["commerce","hotel"],"feature_flags":["seo-suite"]}'
```

The tenant payload now includes:

- `runtime_documents.database`: the tenant-scoped Mongo database name
- `runtime_documents.bootstrap.seeded_document_count`: how many baseline
  runtime docs were created
- `runtime_documents.bootstrap.page_slugs`: the first seeded public pages

Create a tenant token and inspect the seeded publishing runtime:

```bash
TENANT_TOKEN=$(curl -s http://127.0.0.1:8000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"ops@tenant.com","password":"very-secure-password","tenant_slug":"demo-tenant"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

curl -s http://127.0.0.1:8000/publishing/blueprint \
  -H "Authorization: Bearer $TENANT_TOKEN"

curl -s http://127.0.0.1:8000/publishing/pages \
  -H "Authorization: Bearer $TENANT_TOKEN"
```

Recommended local infra prerequisites:

- `postgresql@16` installed and started with Homebrew
- `redis` installed and started with Homebrew
- `mongodb-community@8.0` installed and started with Homebrew
- `kalpzero_enterprise` database created locally

### If You See `role "postgres" does not exist`

Your local Postgres is using the default macOS user role, not a `postgres`
role. Use one of these forms in `apps/api/.env`:

- `postgresql+psycopg:///kalpzero_enterprise`
- `postgresql+psycopg://YOUR_LOCAL_USER@localhost:5432/kalpzero_enterprise`

Do not use `postgres:postgres@localhost` unless you actually created that role.

### If Port `8000` Or `8010` Is Already In Use

Check the running process first:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:8010 -sTCP:LISTEN
```

Then stop the old process or use the matching already-running API instead of
starting another copy.

### Web App

```bash
cd "$REPO_ROOT"
pnpm dev:web
```

Notes:

- verified boot with Next.js dev server
- if port `3000` is already in use, Next.js automatically picks the next free port

### Worker

```bash
cd "$REPO_ROOT"
pnpm dev:worker
```

Verified result:

- the worker starts and prints queue bindings, event handlers, and adapter manifests

## Testing Flow

Run testing in this order:

### 1. Type Check The Workspace

```bash
cd "$REPO_ROOT"
pnpm typecheck
```

Use this to validate TypeScript packages, web, and worker contracts.

### 2. Run The Full API Test Suite

```bash
cd "$REPO_ROOT"
pnpm test:api
```

Use this for the real backend verification pass. This is the most important test
command in the repo right now.

### 3. Run A Faster Smoke Subset

```bash
cd "$REPO_ROOT"
pnpm test:smoke
```

Use this while iterating on onboarding, commerce, or platform changes. It runs:

- `app/tests/test_api.py`
- `app/tests/test_commerce.py`

### 4. Run The Root Test Command

```bash
cd "$REPO_ROOT"
pnpm test
```

What it does now:

- runs the full FastAPI test suite first
- then runs workspace package test scripts through Turbo

Current limitation:

- web, worker, contracts, and UI packages still use placeholder test scripts, so
  meaningful automated coverage is currently concentrated in `apps/api`

## Recommended Testing Sequence Before Onboarding

Use this exact sequence before backend onboarding work:

```bash
cd "$REPO_ROOT"
pnpm install --frozen-lockfile
cd apps/api
./.venv/bin/pip install -e ".[dev]"
cd ..
cd ..
pnpm typecheck
pnpm test:api
pnpm dev:api:local
```

Then, in another terminal:

```bash
curl http://127.0.0.1:8010/health/live
```

For pilot onboarding with real infra, replace `pnpm dev:api:local` with the
real-infra API boot command after configuring `apps/api/.env`.

## Manual Pilot Validation

Use these backend tests as the current reference flows before running manual
API checks:

- `apps/api/app/tests/test_api.py`
- `apps/api/app/tests/test_commerce.py`
- `apps/api/app/tests/test_hotel.py`

The strongest commerce manual path now is:

- create warehouse
- adjust stock
- place order
- create fulfillment
- pack fulfillment
- create shipment
- deliver shipment

The strongest hotel manual path remains:

- create property, room type, and room
- create reservation
- record folio charge and payment
- issue invoice
- complete operational follow-up

## Governance

- No new product work should be added to the legacy repo.
- All new platform contracts, vertical packs, and migrations start here.
- Legacy extraction must remain explicit and auditable through adapter manifests.
- Backend onboarding pilots are currently scoped to hotel and commerce tenants.
