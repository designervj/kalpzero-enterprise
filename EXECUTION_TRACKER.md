# KalpZero Enterprise Execution Tracker

Last updated: April 10, 2026

## Purpose

This file is the working source of truth for:

- what KalpZero Enterprise is doing now
- what must be done next
- what is intentionally deferred
- how to resume work quickly after a gap

Use this before starting a new development session.

## How To Use This Tracker

1. Read `Current Product Stance`.
2. Check `Priority Workboard`.
3. Start from `Recommended Next Order`.
4. After each meaningful work session, update:
   - `Last updated`
   - status
   - next action
   - blockers
   - completion notes

## Status Rules

- `active`: currently in execution and should receive direct effort now
- `next`: ready soon, but should not interrupt the active items yet
- `blocked`: intentionally paused behind a dependency or readiness gate
- `complete`: complete enough for the current phase; only hardening remains

## Priority Rules

- `P0`: directly affects pilot readiness or architecture safety
- `P1`: important for operator usability and business completion
- `P2`: useful next-layer improvement, but not first-order critical
- `P3`: intentionally deferred

## Current Product Stance

- Canonical product repo: `kalpzero-enterprise`
- Super Admin shell exists and works, but still needs deeper operational surfaces
- Super Admin now includes an operations feed for audit and outbox inspection across platform and tenant scopes
- Tenant admin shell exists and works, but is still summary-led rather than module-led
- Commerce is now the lead execution priority
- Hotel remains the reference vertical, but moves into second-position hardening
- Travel exists, but is intentionally deferred behind hotel + commerce pilot confidence
- Onboarding scope should remain limited to `hotel` and `commerce`

## Priority Workboard

| Priority | Stream | Status | Goal | Next action | Exit gate |
| --- | --- | --- | --- | --- | --- |
| P0 | Ecommerce closure | active | bring commerce to the same operational depth as hotel | richer admin flows and deeper finance documents | commerce becomes onboarding-ready for real pilot tenants |
| P0 | Super Admin and onboarding control plane | active | Make Kalp operable from the admin UI without relying on raw API knowledge | deepen tenant visibility, readiness drill-down, cleaner workflow language, and stronger tenant detail inspection | a platform operator can onboard, inspect, and validate pilot tenants from the UI alone |
| P0 | Hotel hardening | active | close the remaining hotel gaps needed for stable pilot usage | secure guest-document flow, guaranteed or confirmed states, settlement hardening, stronger reports, real import execution | hotel is strong enough for pilot onboarding without manual operational workarounds |
| P1 | Tenant admin information architecture | next | move tenant admin from summary shell to a workflow-first operator console | module-driven navigation, better dashboard blocks, clearer commerce and hotel entry points | tenant users can navigate by business job, not by platform concept |
| P1 | Blueprint-driven admin experience | next | use blueprint and registry signals to control navigation, widgets, and vocabulary more deeply | connect blueprint to admin menu structure and dashboard composition | tenant admin becomes configurable without fragmenting the product |
| P1 | Backend onboarding pilot | next | prove onboarding end to end for hotel + commerce businesses | create pilot tenants, validate registry, login, runtime provisioning, and core lifecycle flows | onboarding can be trusted as a repeatable business process |
| P1 | Import execution and reconciliation | next | move from import-plan exposure to actual dry-run and canonical write execution | implement real hotel and commerce dry-run import flow with reconciliation output | external source migration becomes auditable and usable |
| P2 | Audit and operational observability | next | expose the system state more clearly to operators | surface audit trails, outbox activity, and key operational health in the admin | platform state can be inspected without checking code or database directly |
| P3 | Travel completion | blocked | resume travel only after hotel + commerce onboarding pattern is proven | return to traveler records, booking conversion, seat decrement, and supplier workflows | hotel + commerce onboarding pilot is stable |
| P3 | Future vertical expansion | blocked | avoid opening new vertical work before the pilot model is proven | keep future specs documented, but do not build new verticals yet | pilot confidence is established and execution capacity is available |

## Completed Foundations

- canonical repo structure and docs
- FastAPI control plane and core APIs
- tenant-scoped runtime document bootstrap
- Super Admin login, overview shell, and onboarding shell
- Super Admin operations feed with tenant-scope audit and outbox inspection
- tenant workspace shell
- hotel reference vertical
- commerce core operations: catalog, pricing, tax, payments, refunds, settlements, returns, exchanges, warehouse, fulfillment, storefront runtime, and import dry-run or execute

## Recommended Next Order

1. Finish the remaining ecommerce readiness gaps that affect pilot trust.
2. Close the remaining hotel hardening items that affect pilot trust.
3. Upgrade the Super Admin and tenant admin UX so onboarding and operations are clear without technical context.
4. Run the hotel + commerce backend onboarding pilot and capture failures.
5. Only after the pilot is stable, resume travel work.

## Hotel Enhancement Queue

Status: active

Execution priority: second, after ecommerce

Remaining high-value work:

- secure guest-document upload and verification workflow
- guaranteed and confirmed reservation states
- tax profiles and tighter settlement controls
- stronger night-audit closure rules
- deeper financial and operational reports
- actual source import execution and dry-run reconciliation

Do not expand hotel into new optional modules until the above are closed.

## Ecommerce Enhancement Queue

Status: active

Execution priority: first

Remaining high-value work:

- richer commerce-specific admin flows beyond summary APIs
- deeper finance documents such as credit notes and operator-facing reconciliation screens

Do not treat commerce as complete until it reaches the same operational confidence as hotel.

## UX And Design Queue

Status: active

Current UX direction:

- keep the current Kalp Super Admin and Tenant Admin split
- make the admin more workflow-first and less summary-only
- keep business language simple for operators
- use blueprint, registry, and role context to shape the interface
- avoid over-technical system language in primary screens

Next UX work should focus on:

- stronger Super Admin control plane screens
- deeper tenant workspace navigation
- commerce and hotel module entry points
- action-led dashboards, not just information cards
- audit and outbox visibility is now exposed in the Super Admin operations feed
- next Super Admin UX focus should move to deeper tenant detail and readiness drill-down

## Session Restart Checklist

When coming back after a gap:

1. Read this file.
2. Review `docs/15_HOTEL_VERTICAL_STATUS.md`.
3. Review `docs/17_EXTENDED_ECOMMERCE_VERTICAL_PLAN.md`.
4. Review `docs/12_EXECUTION_ROADMAP_90_DAYS.md`.
5. Confirm that the next work still aligns with `Recommended Next Order`.

## Update Notes

- Keep `active` items limited. Too many active items means priority is unclear.
- If something is blocked, write the reason explicitly.
- If a workstream is complete enough for the current phase, move it to `complete`.
- Do not open new vertical work unless a current active stream is intentionally closed.
