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

## Live Deployment

Current live deployment on this server uses:

- Public domain: `https://kalptree.xyz`
- Public API base: `https://kalptree.xyz/api`
- Internal frontend listener: `127.0.0.1:3002`
- Internal backend listener: `127.0.0.1:8012`
- PM2 apps: `kalpzero-web`, `kalpzero-api`
- Auto-commit check script: `scripts/auto-deploy-live.sh`
- Deploy script: `scripts/deploy-live.sh`
- Auto-deploy log: `/tmp/kalpzero-auto-deploy.log`
- Server operations guide: `OPERATIONS.md`

GitHub Actions live deploy behavior:

- the workflow checks out the latest pushed commit on the runner
- the checked-out deploy scripts target the live repo at `/mnt/data/kalpzero-enterprise`
- the live repo is force-synced to `origin/main`, then `pnpm build` runs and PM2 restarts `kalpzero-web` and `kalpzero-api`

Important:

- These are the live server ports behind Nginx and PM2.
- The local development commands below intentionally still use `3000`, `8000`,
  and `8010` where documented. Those are local-only development ports, not the
  live deployment ports.

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

The shared root env in [`.env`](.env) is the source of truth for local services:

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

- `.env`
- the API virtualenv
- Python modules required by the backend
- local `psql`, `redis-cli`, and `mongosh` availability
- live Postgres, Redis, and Mongo connections when those tools exist

## Local Run Commands

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

For onboarding-grade behavior, configure the repo-root `.env` with real
service URLs and secrets before starting the API against live infrastructure.

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

### One Command Super Admin Bootstrap (Local)

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

### Backend Onboarding Smoke Flow (Local Infra)

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
role. Use one of these forms in the repo-root `.env`:

- `postgresql+psycopg:///kalpzero_enterprise`
- `postgresql+psycopg://YOUR_LOCAL_USER@localhost:5432/kalpzero_enterprise`

Do not use `postgres:postgres@localhost` unless you actually created that role.

### If Port `8000` Or `8010` Is Already In Use (Local)

Check the running process first:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:8010 -sTCP:LISTEN
```

Then stop the old process or use the matching already-running API instead of
starting another copy.

### Local Web App

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
real-infra API boot command after configuring the repo-root `.env`.

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

### Ecommerce Import Validation

After onboarding a commerce-enabled tenant, the current tested ecommerce import
path is:

1. create import source
2. run dry-run validation
3. run execute
4. verify imported commerce entities
5. rerun execute to confirm idempotent replay

Example commands:

```bash
API_BASE=${API_BASE:-http://127.0.0.1:8010}

TENANT_TOKEN=$(curl -s "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ops@tenant.com","password":"very-secure-password","tenant_slug":"demo-tenant"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

cat > /tmp/commerce-import-source.json <<'EOF'
{
  "name": "Legacy Commerce Fixture",
  "source_type": "legacy-kalpzero-commerce",
  "connection_profile_key": "inline-fixture",
  "vertical_pack": "commerce",
  "config": {
    "adapter_id": "legacy-kalpzero-commerce",
    "dataset": {
      "categories": [
        {"name": "Footwear", "slug": "footwear"},
        {"name": "Sneakers", "slug": "sneakers", "parent_slug": "footwear"}
      ],
      "brands": [
        {"name": "Kalp Athletics", "slug": "kalp-athletics", "code": "KALP"}
      ],
      "vendors": [
        {"name": "Prime Supply Co", "slug": "prime-supply", "code": "SUP-001"}
      ],
      "collections": [
        {"name": "Summer Launch", "slug": "summer-launch", "sort_order": 1}
      ],
      "warehouses": [
        {
          "name": "Central Warehouse",
          "slug": "central-warehouse",
          "code": "DEL-CWH",
          "city": "Delhi",
          "country": "India",
          "is_default": true
        }
      ],
      "tax_profiles": [
        {
          "name": "GST 18",
          "code": "GST18",
          "prices_include_tax": false,
          "rules": [{"label": "GST", "rate_basis_points": 1800}]
        }
      ],
      "attributes": [
        {
          "code": "material",
          "slug": "material",
          "label": "Material",
          "value_type": "single_select",
          "scope": "product",
          "options": [
            {"value": "mesh", "label": "Mesh"},
            {"value": "leather", "label": "Leather"}
          ],
          "is_required": true
        },
        {
          "code": "color",
          "slug": "color",
          "label": "Color",
          "value_type": "single_select",
          "scope": "variant",
          "options": [
            {"value": "black", "label": "Black"},
            {"value": "white", "label": "White"}
          ],
          "is_required": true,
          "is_variation_axis": true
        },
        {
          "code": "size",
          "slug": "size",
          "label": "Size",
          "value_type": "single_select",
          "scope": "variant",
          "options": [
            {"value": "42", "label": "42"},
            {"value": "43", "label": "43"}
          ],
          "is_required": true,
          "is_variation_axis": true
        }
      ],
      "attribute_sets": [
        {
          "name": "Footwear Core",
          "slug": "footwear-core",
          "attribute_codes": ["material", "color", "size"]
        }
      ],
      "products": [
        {
          "name": "KalpZero Runner",
          "slug": "kalpzero-runner",
          "brand_slug": "kalp-athletics",
          "vendor_slug": "prime-supply",
          "collection_slugs": ["summer-launch"],
          "attribute_set_slug": "footwear-core",
          "category_slugs": ["sneakers"],
          "product_attributes": [
            {"attribute_code": "material", "value": "mesh"}
          ],
          "variants": [
            {
              "sku": "RUN-42-BLK",
              "label": "Black / 42",
              "price_minor": 349900,
              "currency": "INR",
              "inventory_quantity": 12,
              "attribute_values": [
                {"attribute_code": "color", "value": "black"},
                {"attribute_code": "size", "value": "42"}
              ],
              "warehouse_stock": [
                {
                  "warehouse_slug": "central-warehouse",
                  "on_hand_quantity": 12,
                  "low_stock_threshold": 3
                }
              ]
            }
          ]
        }
      ],
      "price_lists": [
        {
          "name": "Retail Default",
          "slug": "retail-default",
          "currency": "INR",
          "items": [
            {"variant_sku": "RUN-42-BLK", "price_minor": 339900}
          ]
        }
      ],
      "coupons": [
        {
          "code": "WELCOME10",
          "discount_type": "percent",
          "discount_value": 1000,
          "minimum_subtotal_minor": 200000,
          "applicable_category_slugs": ["sneakers"],
          "applicable_variant_skus": ["RUN-42-BLK"]
        }
      ]
    }
  }
}
EOF

SOURCE_ID=$(curl -s "$API_BASE/imports/sources" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  --data @/tmp/commerce-import-source.json \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

curl -s "$API_BASE/imports/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -d "{\"source_id\":\"$SOURCE_ID\",\"mode\":\"dry_run\"}" | python3 -m json.tool

curl -s "$API_BASE/imports/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -d "{\"source_id\":\"$SOURCE_ID\",\"mode\":\"execute\"}" | python3 -m json.tool

curl -s "$API_BASE/commerce/products" \
  -H "Authorization: Bearer $TENANT_TOKEN" | python3 -m json.tool

curl -s "$API_BASE/commerce/stock-levels" \
  -H "Authorization: Bearer $TENANT_TOKEN" | python3 -m json.tool

curl -s "$API_BASE/imports/jobs" \
  -H "Authorization: Bearer $TENANT_TOKEN" | python3 -m json.tool
```

## Governance

- No new product work should be added to the legacy repo.
- All new platform contracts, vertical packs, and migrations start here.
- Legacy extraction must remain explicit and auditable through adapter manifests.
- Backend onboarding pilots are currently scoped to hotel and commerce tenants.
