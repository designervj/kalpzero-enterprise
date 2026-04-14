# 10 Public Publishing And Discovery

## Objective

Publishing is part of the core platform, not a fallback demo layer. Brand,
domains, pages, SEO, and transactional public surfaces are backed by canonical
contracts.

## Business Blueprint Rule

Every tenant-facing surface must be governed by a `Business Blueprint`, not by
hardcoded frontend branching. The blueprint is the rule contract between design
flexibility and platform control.

The blueprint owns:

- business label and vocabulary
- enabled modules and route exposure
- public and admin theme tokens
- public and admin navigation
- public route registry
- dashboard widgets
- mobile capabilities

This keeps each business configurable without fragmenting the product into a
different codebase per tenant.

## Runtime Documents

Runtime documents live in MongoDB and hold flexible tenant-authored payloads
that do not belong in transactional SQL tables.

Current publishing collections:

- `business_blueprints`
- `site_pages`
- `discovery_profiles`

These documents are seeded from tenant metadata, then updated through the
canonical API.

## Required Surfaces

- Brand and domain management
- Draft, preview, and live page states
- SEO title, description, and structured data hooks
- Commerce storefront pages
- Travel package landing pages
- Hotel property and booking pages
- Discovery cards and search-facing landing data
- Admin shell theming and navigation previews

## Public And Admin Rendering

- Public runtime: Next.js resolves the tenant slug, fetches the public site
  payload from FastAPI, and renders reusable blocks using blueprint theme
  tokens.
- Admin runtime: Next.js fetches the same blueprint contract and renders a
  branded operator shell with controlled module exposure.
- Future mobile runtime: React Native should reuse the same blueprint contract
  for navigation, vocabulary, and capability gating.

The current implementation already exposes:

- `GET /publishing/public/{tenant_slug}/site`
- `GET /publishing/public/{tenant_slug}/blueprint-preview`
- `GET|PUT /publishing/blueprint`
- `GET|PUT /publishing/pages/{page_slug}`
- `GET|PUT /publishing/discovery`

## Guardrails

- No fallback sample content in production flows
- No raw arbitrary tenant JavaScript injection
- No per-tenant auth or business logic in Next.js route handlers
- No privilege escalation through unpublished modules or unregistered routes
- Public rendering can read only live or explicitly preview-scoped content

## Design Flexibility Model

KalpZero Enterprise supports flexibility through three layers:

1. Theme tokens for color, typography, motion, spacing, and density
2. Component or block registries for reusable public and admin building blocks
3. Page and route schemas that bind blocks to business data and SEO metadata

This model is flexible enough for commerce, travel, hotel, and later verticals
without losing operational consistency.

## Current Status On April 1, 2026

- Blueprint contracts are implemented in
  `/Users/apple/Desktop/WORK/GIT/kalpzero-enterprise/packages/contracts/src/platform/publishing.ts`
- Runtime publishing services are implemented in
  `/Users/apple/Desktop/WORK/GIT/kalpzero-enterprise/apps/api/app/services/publishing.py`
- Canonical travel APIs are implemented in
  `/Users/apple/Desktop/WORK/GIT/kalpzero-enterprise/apps/api/app/services/travel.py`
  and now supply live travel-specific blocks and discovery materializations
- Canonical commerce APIs now supply live catalog blocks, product detail pages,
  and commerce discovery materializations through the same blueprint runtime
- Public and admin preview routes are implemented in
  `/Users/apple/Desktop/WORK/GIT/kalpzero-enterprise/apps/web/app/[tenantSlug]/[[...pageSlug]]/page.tsx`
  and
  `/Users/apple/Desktop/WORK/GIT/kalpzero-enterprise/apps/web/app/studio/[tenantSlug]/page.tsx`
- The runtime document layer is test-backed in
  `/Users/apple/Desktop/WORK/GIT/kalpzero-enterprise/apps/api/app/tests/test_publishing.py`

## Legacy Note

The current repo uses fallback discovery content in
`/Users/apple/Desktop/WORK/GIT/kalpzero/src/lib/discovery-public.ts`. The new
system must only publish canonical data or explicitly marked preview fixtures.
