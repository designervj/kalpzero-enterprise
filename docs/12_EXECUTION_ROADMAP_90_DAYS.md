# 12 Execution Roadmap 90 Days

## Phase 0

- Bootstrap repo, CI, env validation, contracts, and docs
- Freeze the legacy repo as feature reference only
- Confirm Wave 1 canonical entities and API boundaries

Status on March 31, 2026: complete.

## Phase 1

- Implement auth, tenancy, registry, audit, job framework, and import framework
- Add shared SQL and document-store persistence
- Add outbox and worker consumption model

Status on April 1, 2026: foundation implemented in the canonical repo. This
now includes explicit onboarding-readiness reporting and fail-closed tenant
creation gates for approved Wave 1 verticals and valid infra combinations.
As of April 2, 2026, tenant creation also provisions a tenant-scoped Mongo
runtime database, creates the canonical runtime collections, and seeds the
first blueprint, public pages, and discovery payloads for UI bootstrap.

## Phase 2

- Build commerce pack with catalog, order flow, and publishing foundation
- Add first import adapter from current commerce data

Status on April 1, 2026: started. Core catalog and order persistence is now
implemented, plus a concrete legacy-commerce adapter plan. The publishing
foundation has also moved from a placeholder concept into a blueprint-driven
runtime backed by Mongo documents and public/admin Next.js previews. Remaining
work is import execution, richer operator-facing commerce admin flows, and
deeper finance documents.

Priority on April 10, 2026: commerce is now the lead active vertical. Hotel
remains the reference vertical, but current execution should prioritize
commerce closure first and hotel hardening second. The first backend onboarding
pilot should still target hotel and commerce before travel is promoted
further.

Implementation checkpoint on April 2, 2026:

- commerce attribute definitions are now implemented
- commerce attribute sets are now implemented
- commerce brands, vendors, and collections are now implemented
- product linkage to those catalog governance entities is now implemented
- product-level and variant-level attribute value validation is now implemented
- commerce tax profiles, price lists, and coupons are now implemented
- commerce orders now calculate subtotal, discount, tax, and final totals
- commerce payments, refunds, and invoice issuance are now implemented
- commerce settlements and reconciliation records are now implemented
- commerce warehouses, stock adjustments, and stock ledger are now implemented
- commerce fulfillments and shipments are now implemented
- commerce returns and exchanges are now implemented with delivered-line
  validation and inventory restock on receipt
- commerce storefront and product detail materialization are now implemented in
  the public blueprint runtime
- the attribute taxonomy is positioned as the first reusable pattern for later
  vertical packs

## Phase 3

- Build travel pack with packages, departures, itinerary, and leads
- Port public package publishing concepts from the legacy repo

Status on April 1, 2026: started. Canonical SQL travel entities and APIs now
cover packages, itinerary days, departures, and leads, plus a formal legacy
adapter plan. Remaining work is traveler records, quote-to-booking conversion,
seat decrement logic, supplier references, and travel-specific public package
blocks inside the blueprint runtime.

Decision on April 2, 2026: travel is deferred behind commerce. Real estate
stays blocked until it is modeled as a true domain instead of a commerce
overlay.

## Phase 4

- Build the unified hotel pack with reservation and operational workflows
- Replace legacy split hotel concepts with one canonical schema

Status on April 1, 2026: started early because hotel was the highest-risk
legacy schema split. Core PMS entities, operational flows, inventory summary,
meal plans, guest profiles, late room assignment, richer reservation fields,
rate plans, availability rules, folios, payments, and invoice issuance are now
implemented. Refunds, staff and shifts, and night audit are also now in place.
Stay records, room moves, guest documents, property profile content, nearby and
amenity docs, reporting, and hotel import-plan exposure are also now in place.
Remaining work is migration execution, tax/settlement hardening, and deeper
enterprise analytics.

Stabilization priority on April 10, 2026: hotel should now move through
targeted hardening only, behind the current commerce-first execution order, so
that backend onboarding pilots can still rely on it as the reference vertical.

## Phase 5

- Connect the user's external project databases through formal adapters
- Run dry-run migration rehearsals and reconcile mapping gaps

## Phase 6

- Specify real estate, clinic, doctor site, school, and LMS packs
- Prioritize the next two verticals based on migration readiness and revenue fit

Status on April 10, 2026:

- commerce closure before pilot onboarding: required
- hotel hardening before pilot onboarding: required
- next vertical after commerce and hotel onboarding pilot: travel
- pilot-ready onboarding scope now: hotel and commerce only
- blocked from onboarding readiness: real estate, clinic, doctor site, school,
  LMS, and travel
 
## Immediate Pilot Order

1. Complete the extended commerce vertical to hotel-grade readiness.
2. Close the remaining hotel stabilization backlog.
3. Test backend business onboarding using hotel and commerce tenants.
4. Resume travel only after the onboarding pilot proves the pattern.
