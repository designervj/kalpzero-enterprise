# 15 Hotel Vertical Status

## Current State

As of April 2, 2026, hotel is the most complete vertical in KalpZero
Enterprise.

Implemented:

- property, room type, room, reservation
- late room assignment and no-show flow
- split room operational state
- housekeeping and maintenance
- meal plans and guest profiles
- guest document metadata
- rate plans and availability rules
- folios, charges, payments, refunds, invoices
- staff members, shifts, and assignment references
- night audit
- stay records and room-move history
- property profile, amenities, and nearby public content
- summary reporting
- external hotel import-plan exposure

## Remaining Work

These are now the hotel-specific gaps that remain:

- secure guest-document upload and verification workflow
- guaranteed and confirmed reservation states
- tax profiles, settlement controls, and tighter night-audit closure rules
- deeper revenue-management logic
- workforce attendance analytics
- richer financial and operational reports
- actual import execution and dry-run reconciliation against source data
- long-stay and rent-variant extensions

## Stabilization Target

Hotel should now be treated as the reference vertical with a limited hardening
queue, not as an actively expanding product shape.

As of April 10, 2026, hotel remains the reference vertical but is no longer
the lead execution stream. Current product priority is ecommerce first, then
hotel hardening, then onboarding pilot validation.

Before backend onboarding pilots broaden beyond hotel, the next hotel work
should focus on:

- secure guest-document upload and verification
- reservation-state hardening for guaranteed and confirmed flows
- tax and settlement hardening
- stronger financial and operational reports
- source import execution and reconciliation

## Conclusion

Hotel is now complete enough to act as the canonical vertical case study for
KalpZero.

It should be treated as the reference implementation for:

- master data
- inventory or capacity
- lifecycle transitions
- operations and assignments
- finance closure
- public content
- migration planning

Future vertical onboarding should match this pattern rather than starting from
custom UI or loose CRUD models.
