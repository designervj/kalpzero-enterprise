# 17 Extended Ecommerce Vertical Plan

## Purpose

This document defines the enterprise ecommerce target for KalpZero as the
current lead execution priority.

The goal is not a basic store. The goal is a reusable commerce operating
vertical that supports multiple business styles and becomes the first backend
onboarding pilot after hotel.

## Why Ecommerce Comes Before Travel

Commerce is the most reusable shared business capability in the current
pipeline.

It can support:

- D2C retail
- catalog businesses
- B2B ordering
- add-on sales for hotel and travel
- productized service businesses
- future mixed businesses that need both booking and selling

That makes commerce the best current platform investment before broader pilot
onboarding.

## Current Canonical Capability

The current repo already has:

- categories
- brands
- vendors
- collections
- attribute definitions
- attribute sets
- products
- variants
- product and variant attribute values
- tax profiles
- price lists
- coupons
- payments
- refunds
- settlements
- invoices
- orders
- order lines
- warehouses
- warehouse stock records
- stock ledger entries
- fulfillments
- shipments
- priced order totals with subtotal, discount, tax, and final amount
- inventory reservation on order placement
- inventory restore on cancellation
- warehouse-aware reservation and shipment release
- audit and outbox coverage
- a legacy import-plan endpoint

This is now a strong operating base and is close to onboarding-ready ecommerce,
but it still needs closure on import execution, richer operator surfaces, and
deeper finance documents.

The important architectural point is that the attribute system is no longer
just product-local metadata. It is now the first reusable catalog-taxonomy
pattern intended to be mirrored by other vertical packs where master entities
also need governed attributes and grouped field contracts.

## Ecommerce Must Reach The Hotel Readiness Pattern

Commerce should be completed against the same reference pattern established by
hotel:

1. `master data`
Categories, collections, brands, vendors, attributes, media bindings.

2. `inventory or capacity`
Warehouses, stock ledger, reservations, stock adjustments, transfers.

3. `transaction lifecycle`
Cart, checkout, payment, order, fulfillment, return, exchange, cancellation.

4. `operational work`
Pick-pack-ship, warehouse tasking, packing slips, shipment handling.

5. `finance closure`
Coupons, price lists, tax profiles, refunds, invoices, settlements, credit notes.

6. `public surface`
SEO storefront, category pages, product pages, search, recommendations, discovery.

7. `migration`
Source mapping, dry-run validation, canonical write, reconciliation, audit trail.

## Extended Commerce Scope

### Catalog Core

- category hierarchy
- collections
- brands
- vendors and supplier references
- attributes and option sets
- rich media and merchandising flags
- product bundles and kits

Implementation checkpoint:

- category, brand, vendor, and collection masters now exist
- product linkage to those catalog entities now exists
- attribute and attribute-set governance now exists
- product and variant attribute validation now exists

### Pricing Layer

- base pricing
- customer-group pricing
- B2B price lists
- sale scheduling
- coupon and promotion engine
- gift card extension point
- tax-inclusive and tax-exclusive pricing modes

Implementation checkpoint:

- tax profile masters now exist
- price list masters with per-variant overrides now exist
- coupon masters with category and variant scoping now exist
- order creation now calculates subtotal, discount, tax, and total explicitly
- order finance now includes payment capture, refunds, and invoice issuance
- settlement and reconciliation records now exist

### Inventory Layer

- warehouses
- stock ledger entries
- reservation and release rules
- stock transfers
- low-stock thresholds
- manual adjustments with audit

Implementation checkpoint:

- warehouse masters now exist
- stock adjustments and low-stock thresholds now exist
- stock ledger entries now exist
- warehouse-aware reservation and release now exist

### Order Lifecycle

- cart model
- checkout intent
- payment state
- order confirmation
- cancellation rules
- return and exchange requests
- refund state machine

Implementation checkpoint:

- order lines now track allocated warehouse and fulfilled quantity
- fulfillment creation now exists
- shipment creation and delivery confirmation now exist
- returns and exchanges now exist with delivered-line validation, status flow,
  and inventory restock on receipt

### Operations Layer

- fulfillment orders
- shipment records
- packing slips
- warehouse task queues
- dispatch and delivery status hooks

Implementation checkpoint:

- fulfillment orders now exist
- shipment records now exist
- pick-to-pack and ship-to-deliver transitions now exist

### Finance Layer

- tax profiles
- invoice issuance
- refund ledger
- settlement records
- credit notes
- reconciliation hooks for payment gateways

Implementation checkpoint:

- settlement records now exist
- settlement entry linkage for payments, refunds, fees, and adjustments now exists
- duplicate payment and refund settlement linkage is now blocked
- commerce overview now exposes settlement status and unreconciled finance counts

### Public Experience

- category storefront pages
- product detail pages
- collection landing pages
- cart and checkout pages
- merchandising blocks
- search and filter materialization
- SEO and structured data

Implementation checkpoint:

- live catalog blocks now materialize into the blueprint runtime
- product detail pages now resolve from the canonical commerce catalog
- commerce discovery cards now expose live products through the public site payload

### Migration And Imports

- legacy Kalp catalog import execution
- dry-run validation mode
- duplicate detection
- inventory reconciliation
- external source adapters for larger catalogs

## What Must Not Happen

- commerce must not become the hidden schema for real estate
- commerce must not replace the true travel booking model
- storefront CRUD alone must not be treated as onboarding-ready ecommerce

## Backend Onboarding Pilot

After ecommerce closure and hotel hardening, the first backend onboarding pilot
should use:

- hotel tenants
- commerce tenants

The pilot should prove:

- tenant provisioning works cleanly
- blueprint and theme assignment works cleanly
- module entitlement works cleanly
- core lifecycle operations work end to end
- finance closure works end to end
- import dry-run and canonical write are auditable

## Delivery Order

1. Close the remaining ecommerce readiness gaps first.
2. Extend the new attribute system into richer catalog governance:
   advanced option rules, inherited defaults, and merchandising rules.
3. Harden the pricing layer into broader promotions and approval controls.
4. Add operator-facing reconciliation surfaces and richer finance documents.
5. Add credit-note controls and deeper settlement workflows.
6. Execute legacy commerce import dry-runs.
7. Close the remaining hotel hardening queue needed for pilot confidence.
8. Run backend business onboarding pilot on hotel and commerce.
9. Resume travel after the pilot proves the onboarding pattern.

## Readiness Gate

Commerce is onboarding-ready only when all of the following are true:

- canonical master entities exist
- inventory and reservation rules are explicit
- lifecycle states are explicit
- operations are modeled
- finance closure exists
- audit and outbox coverage exists
- public blueprint exists
- import adapter and dry-run exist
- tests cover the main lifecycle
