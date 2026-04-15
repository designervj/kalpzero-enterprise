# Apps API Database Schema

This document was prepared after reviewing the SQL model layer, startup schema creation path, and domain/test flows inside `apps/api`. It focuses on the relational tables created by the API and adds realistic example rows so the stored data shape is easy to understand.

## How The SQL Schema Gets Created

- `apps/api/app/main.py` calls `init_db(...)` during FastAPI startup.
- `apps/api/app/db/session.py` normalizes the database URL, creates the database if needed, and runs `Base.metadata.create_all(bind=engine)`.
- `apps/api/app/db/models.py` defines every relational table listed below.
- There is no Alembic migration directory in `apps/api` right now, so this schema is model-driven.
- I also checked `apps/api/dev.db`: all relational tables already exist there, but every table currently has `0` rows. The examples below are therefore illustrative examples based on the code and tests, not copied runtime data.

## Shared Conventions

- Every table has a `VARCHAR(36)` UUID primary key.
- Every table has `created_at` from `TimestampMixin`; there is no universal SQL `updated_at`.
- Most business tables are tenant-scoped through `tenant_id -> tenants.id`.
- Money is stored in `*_minor` integer fields.
- JSON columns are used heavily for flexible lists/objects.
- Many operational timestamps are stored as ISO 8601 strings in `VARCHAR(64)`/`TEXT` columns instead of native SQL datetime columns.
- Status validation mostly lives in the service layer, not in database enums/check constraints.

## Domain Counts

The API currently creates **59 relational tables** in total.

| Domain | Table Count |
| --- | ---: |
| Platform & Imports | 6 |
| Travel | 4 |
| Hotel | 20 |
| Commerce | 29 |

## Table Reference

## Platform & Imports

### `agencies`

**Purpose:** Top-level organization/partner records that own tenants.

**Key relations:** No foreign keys on this table.

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `slug` | `VARCHAR(120)` | No | - | UNIQUE; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `region` | `VARCHAR(32)` | No | - | - |
| `owner_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "slug": "enterprise-agency",
  "name": "Enterprise Agency",
  "region": "in",
  "owner_user_id": "founder@kalpzero.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `tenants`

**Purpose:** Tenant businesses created during onboarding; most business tables reference this row.

**Key relations:** `agency_id` -> `agencies.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `agency_id` | `VARCHAR(36)` | No | - | FK -> agencies.id; INDEX |
| `slug` | `VARCHAR(120)` | No | - | UNIQUE; INDEX |
| `display_name` | `VARCHAR(255)` | No | - | - |
| `infra_mode` | `VARCHAR(32)` | No | - | - |
| `vertical_packs` | `JSON` | No | [] | - |
| `feature_flags` | `JSON` | No | [] | - |
| `dedicated_profile_id` | `VARCHAR(120)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000002",
  "agency_id": "00000000-0000-0000-0000-000000000001",
  "slug": "hotel-commerce-demo",
  "display_name": "Hotel Commerce Demo",
  "infra_mode": "dedicated",
  "vertical_packs": [
    "hotel",
    "commerce"
  ],
  "feature_flags": [
    "custom-domain",
    "seo-suite"
  ],
  "dedicated_profile_id": "dedicated-infra-demo",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `audit_events`

**Purpose:** Immutable audit trail for platform and business actions.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | Yes | - | FK -> tenants.id |
| `actor_user_id` | `VARCHAR(255)` | No | - | - |
| `action` | `VARCHAR(120)` | No | - | INDEX |
| `subject_type` | `VARCHAR(120)` | No | - | - |
| `subject_id` | `VARCHAR(120)` | No | - | - |
| `metadata_json` | `JSON` | No | {} | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000003",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "actor_user_id": "founder@kalpzero.com",
  "action": "platform.tenant.created",
  "subject_type": "tenant",
  "subject_id": "00000000-0000-0000-0000-000000000002",
  "metadata_json": {
    "slug": "hotel-commerce-demo",
    "runtime_database": "kalpzero_runtime__tenant__hotel_commerce_demo"
  },
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `import_sources`

**Purpose:** Registered external source definitions for canonical imports.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `source_type` | `VARCHAR(32)` | No | - | - |
| `connection_profile_key` | `VARCHAR(255)` | No | - | - |
| `vertical_pack` | `VARCHAR(32)` | No | - | - |
| `config_json` | `JSON` | No | {} | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000004",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Legacy Commerce Fixture",
  "source_type": "legacy-kalpzero-commerce",
  "connection_profile_key": "inline-fixture",
  "vertical_pack": "commerce",
  "config_json": {
    "adapter_id": "legacy-kalpzero-commerce",
    "dataset": {
      "categories": [
        {
          "name": "Footwear",
          "slug": "footwear"
        }
      ]
    }
  },
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `import_jobs`

**Purpose:** Import execution history with status and structured reports.

**Key relations:** `tenant_id` -> `tenants.id`, `source_id` -> `import_sources.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `source_id` | `VARCHAR(36)` | No | - | FK -> import_sources.id; INDEX |
| `requested_by_user_id` | `VARCHAR(255)` | No | - | - |
| `mode` | `VARCHAR(32)` | No | - | - |
| `status` | `VARCHAR(32)` | No | "queued" | - |
| `report_json` | `JSON` | No | {} | - |
| `finished_at` | `VARCHAR(64)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000005",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "source_id": "00000000-0000-0000-0000-000000000004",
  "requested_by_user_id": "ops@tenant.com",
  "mode": "execute",
  "status": "completed",
  "report_json": {
    "stage": "execute_complete",
    "summary": "Commerce import completed successfully.",
    "totals": {
      "created": 12,
      "errors": 0
    }
  },
  "finished_at": "2026-04-15T09:01:12+00:00",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `outbox_events`

**Purpose:** Transactional outbox rows for domain-event publication.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | Yes | - | FK -> tenants.id |
| `aggregate_id` | `VARCHAR(120)` | No | - | INDEX |
| `event_name` | `VARCHAR(120)` | No | - | INDEX |
| `payload_json` | `JSON` | No | {} | - |
| `status` | `VARCHAR(32)` | No | "pending" | - |
| `published_at` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000006",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "aggregate_id": "00000000-0000-0000-0000-000000000002",
  "event_name": "tenant.provisioned",
  "payload_json": {
    "tenant_slug": "hotel-commerce-demo",
    "vertical_packs": [
      "hotel",
      "commerce"
    ]
  },
  "status": "pending",
  "published_at": null,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

## Travel

### `travel_packages`

**Purpose:** Master records for sellable travel packages.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `code` | `VARCHAR(64)` | No | - | INDEX |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `title` | `VARCHAR(255)` | No | - | - |
| `summary` | `TEXT` | Yes | - | - |
| `origin_city` | `VARCHAR(120)` | No | - | - |
| `destination_city` | `VARCHAR(120)` | No | - | - |
| `destination_country` | `VARCHAR(120)` | No | - | - |
| `duration_days` | `INTEGER` | No | - | - |
| `base_price_minor` | `INTEGER` | No | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000007",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "code": "GOA-ESC-01",
  "slug": "goa-escape",
  "title": "Goa Escape",
  "summary": "Beach escape with curated stays and activities.",
  "origin_city": "Delhi",
  "destination_city": "Goa",
  "destination_country": "India",
  "duration_days": 4,
  "base_price_minor": 4599000,
  "currency": "INR",
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `travel_itinerary_days`

**Purpose:** Day-wise itinerary rows attached to a travel package.

**Key relations:** `tenant_id` -> `tenants.id`, `package_id` -> `travel_packages.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `package_id` | `VARCHAR(36)` | No | - | FK -> travel_packages.id; INDEX |
| `day_number` | `INTEGER` | No | - | - |
| `title` | `VARCHAR(255)` | No | - | - |
| `summary` | `TEXT` | No | - | - |
| `hotel_ref_id` | `VARCHAR(120)` | Yes | - | - |
| `activity_ref_ids` | `JSON` | No | [] | - |
| `transfer_ref_ids` | `JSON` | No | [] | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000008",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "package_id": "00000000-0000-0000-0000-000000000007",
  "day_number": 2,
  "title": "North Goa exploration",
  "summary": "Guided sightseeing with beach and fort visits.",
  "hotel_ref_id": "hotel_goa_01",
  "activity_ref_ids": [
    "activity_beach_hop",
    "activity_fort_visit"
  ],
  "transfer_ref_ids": [
    "transfer_sightseeing"
  ],
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `travel_departures`

**Purpose:** Date-specific departures and seat inventory for a package.

**Key relations:** `tenant_id` -> `tenants.id`, `package_id` -> `travel_packages.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `package_id` | `VARCHAR(36)` | No | - | FK -> travel_packages.id; INDEX |
| `departure_date` | `DATE` | No | - | - |
| `return_date` | `DATE` | No | - | - |
| `seats_total` | `INTEGER` | No | - | - |
| `seats_available` | `INTEGER` | No | - | - |
| `price_override_minor` | `INTEGER` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "scheduled" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000009",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "package_id": "00000000-0000-0000-0000-000000000007",
  "departure_date": "2026-05-10",
  "return_date": "2026-05-13",
  "seats_total": 24,
  "seats_available": 18,
  "price_override_minor": 4899000,
  "status": "scheduled",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `travel_leads`

**Purpose:** Inbound travel sales leads tied to packages/departures.

**Key relations:** `tenant_id` -> `tenants.id`, `interested_package_id` -> `travel_packages.id`, `departure_id` -> `travel_departures.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `source` | `VARCHAR(64)` | No | - | - |
| `interested_package_id` | `VARCHAR(36)` | Yes | - | FK -> travel_packages.id |
| `departure_id` | `VARCHAR(36)` | Yes | - | FK -> travel_departures.id |
| `customer_id` | `VARCHAR(120)` | Yes | - | - |
| `contact_name` | `VARCHAR(255)` | No | - | - |
| `contact_phone` | `VARCHAR(32)` | No | - | - |
| `travelers_count` | `INTEGER` | No | 1 | - |
| `desired_departure_date` | `DATE` | Yes | - | - |
| `budget_minor` | `INTEGER` | Yes | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `status` | `VARCHAR(32)` | No | "new" | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000010",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "source": "instagram",
  "interested_package_id": "00000000-0000-0000-0000-000000000007",
  "departure_id": "00000000-0000-0000-0000-000000000009",
  "customer_id": "cust_travel_001",
  "contact_name": "Naina Sharma",
  "contact_phone": "+919999999999",
  "travelers_count": 2,
  "desired_departure_date": "2026-05-10",
  "budget_minor": 5000000,
  "currency": "INR",
  "status": "qualified",
  "notes": "Interested in premium room upgrade.",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

## Hotel

### `hotel_properties`

**Purpose:** Property master records for hotels/stays.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `code` | `VARCHAR(64)` | No | - | INDEX |
| `city` | `VARCHAR(120)` | No | - | - |
| `country` | `VARCHAR(120)` | No | - | - |
| `timezone` | `VARCHAR(64)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000011",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "KalpZero Suites",
  "code": "KZS-IN-001",
  "city": "Goa",
  "country": "India",
  "timezone": "Asia/Kolkata",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_room_types`

**Purpose:** Room-category definitions, pricing base, and amenity references.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `code` | `VARCHAR(64)` | No | - | - |
| `category` | `VARCHAR(120)` | Yes | - | - |
| `bed_type` | `VARCHAR(120)` | Yes | - | - |
| `occupancy` | `INTEGER` | No | - | - |
| `room_size_sqm` | `INTEGER` | Yes | - | - |
| `base_rate_minor` | `INTEGER` | No | - | - |
| `extra_bed_price_minor` | `INTEGER` | No | 0 | - |
| `refundable` | `BOOLEAN` | No | true | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `amenity_ids` | `JSON` | No | [] | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000012",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "name": "Executive Suite",
  "code": "EX-S",
  "category": "Suite",
  "bed_type": "King",
  "occupancy": 3,
  "room_size_sqm": 65,
  "base_rate_minor": 1850000,
  "extra_bed_price_minor": 250000,
  "refundable": true,
  "currency": "INR",
  "amenity_ids": [
    "wifi",
    "bathtub",
    "work_desk"
  ],
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_rooms`

**Purpose:** Physical room inventory and live operational status.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `room_type_id` -> `hotel_room_types.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `room_type_id` | `VARCHAR(36)` | No | - | FK -> hotel_room_types.id; INDEX |
| `room_number` | `VARCHAR(32)` | No | - | - |
| `status` | `VARCHAR(32)` | No | "available" | - |
| `occupancy_status` | `VARCHAR(32)` | No | "vacant" | - |
| `housekeeping_status` | `VARCHAR(32)` | No | "clean" | - |
| `sell_status` | `VARCHAR(32)` | No | "sellable" | - |
| `is_active` | `BOOLEAN` | No | true | - |
| `feature_tags` | `JSON` | No | [] | - |
| `notes` | `TEXT` | Yes | - | - |
| `last_cleaned_at` | `VARCHAR(64)` | Yes | - | - |
| `floor_label` | `VARCHAR(64)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000013",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "room_type_id": "00000000-0000-0000-0000-000000000012",
  "room_number": "701",
  "status": "available",
  "occupancy_status": "vacant",
  "housekeeping_status": "clean",
  "sell_status": "sellable",
  "is_active": true,
  "feature_tags": [
    "corner",
    "sea_view"
  ],
  "notes": "VIP floor inventory",
  "last_cleaned_at": "2026-04-15T10:30:00+00:00",
  "floor_label": "7",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_meal_plans`

**Purpose:** Meal-plan catalog for hotel reservations.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `code` | `VARCHAR(32)` | No | - | - |
| `name` | `VARCHAR(255)` | No | - | - |
| `description` | `TEXT` | Yes | - | - |
| `price_per_person_per_night_minor` | `INTEGER` | No | 0 | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `included_meals` | `JSON` | No | [] | - |
| `is_active` | `BOOLEAN` | No | true | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000014",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "code": "MAP",
  "name": "Modified American Plan",
  "description": "Breakfast and dinner included.",
  "price_per_person_per_night_minor": 350000,
  "currency": "INR",
  "included_meals": [
    "Breakfast",
    "Dinner"
  ],
  "is_active": true,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_guest_profiles`

**Purpose:** Reusable guest CRM/profile records.

**Key relations:** `tenant_id` -> `tenants.id`, `preferred_room_type_id` -> `hotel_room_types.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `first_name` | `VARCHAR(120)` | No | - | - |
| `last_name` | `VARCHAR(120)` | No | - | - |
| `email` | `VARCHAR(255)` | No | - | INDEX |
| `phone` | `VARCHAR(32)` | No | - | - |
| `nationality` | `VARCHAR(120)` | Yes | - | - |
| `loyalty_tier` | `VARCHAR(64)` | Yes | - | - |
| `vip` | `BOOLEAN` | No | false | - |
| `preferred_room_type_id` | `VARCHAR(36)` | Yes | - | FK -> hotel_room_types.id |
| `dietary_preference` | `VARCHAR(120)` | Yes | - | - |
| `company_name` | `VARCHAR(255)` | Yes | - | - |
| `identity_document_number` | `VARCHAR(120)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000015",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "first_name": "Naina",
  "last_name": "Sharma",
  "email": "naina.sharma@example.com",
  "phone": "+919999999999",
  "nationality": "Indian",
  "loyalty_tier": "Gold",
  "vip": true,
  "preferred_room_type_id": "00000000-0000-0000-0000-000000000012",
  "dietary_preference": "Vegetarian",
  "company_name": "KalpZero Ventures",
  "identity_document_number": "ID-998877",
  "notes": "Repeat guest with premium preferences",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_rate_plans`

**Purpose:** Room-type pricing plans including seasonal/weekend logic.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `room_type_id` -> `hotel_room_types.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `room_type_id` | `VARCHAR(36)` | No | - | FK -> hotel_room_types.id; INDEX |
| `label` | `VARCHAR(255)` | No | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `weekend_enabled` | `BOOLEAN` | No | false | - |
| `weekend_rate_minor` | `INTEGER` | Yes | - | - |
| `seasonal_overrides` | `JSON` | No | [] | - |
| `is_active` | `BOOLEAN` | No | true | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000016",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "room_type_id": "00000000-0000-0000-0000-000000000012",
  "label": "BAR Flexible",
  "currency": "INR",
  "weekend_enabled": true,
  "weekend_rate_minor": 2450000,
  "seasonal_overrides": [
    {
      "season_name": "Summer Peak",
      "start_date": "2026-05-01",
      "end_date": "2026-06-15",
      "price_minor": 2750000
    }
  ],
  "is_active": true,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_availability_rules`

**Purpose:** Bookability rules such as stay windows and blackout dates.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `room_type_id` -> `hotel_room_types.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `room_type_id` | `VARCHAR(36)` | No | - | FK -> hotel_room_types.id; INDEX |
| `total_units` | `INTEGER` | No | - | - |
| `available_units_snapshot` | `INTEGER` | Yes | - | - |
| `minimum_stay_nights` | `INTEGER` | No | 1 | - |
| `maximum_stay_nights` | `INTEGER` | No | 30 | - |
| `blackout_dates` | `JSON` | No | [] | - |
| `is_active` | `BOOLEAN` | No | true | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000017",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "room_type_id": "00000000-0000-0000-0000-000000000012",
  "total_units": 12,
  "available_units_snapshot": 9,
  "minimum_stay_nights": 2,
  "maximum_stay_nights": 10,
  "blackout_dates": [
    "2026-12-31"
  ],
  "is_active": true,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_reservations`

**Purpose:** Reservation headers from pending through checkout/cancellation.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `room_type_id` -> `hotel_room_types.id`, `room_id` -> `hotel_rooms.id`, `meal_plan_id` -> `hotel_meal_plans.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `room_type_id` | `VARCHAR(36)` | No | - | FK -> hotel_room_types.id; INDEX |
| `room_id` | `VARCHAR(36)` | Yes | - | FK -> hotel_rooms.id; INDEX |
| `meal_plan_id` | `VARCHAR(36)` | Yes | - | FK -> hotel_meal_plans.id |
| `booking_reference` | `VARCHAR(64)` | Yes | - | INDEX |
| `booking_source` | `VARCHAR(64)` | Yes | - | - |
| `guest_customer_id` | `VARCHAR(120)` | No | - | - |
| `guest_name` | `VARCHAR(255)` | Yes | - | - |
| `check_in_date` | `DATE` | No | - | - |
| `check_out_date` | `DATE` | No | - | - |
| `status` | `VARCHAR(32)` | No | "reserved" | - |
| `special_requests` | `TEXT` | Yes | - | - |
| `early_check_in` | `BOOLEAN` | No | false | - |
| `late_check_out` | `BOOLEAN` | No | false | - |
| `actual_check_in_at` | `VARCHAR(64)` | Yes | - | - |
| `actual_check_out_at` | `VARCHAR(64)` | Yes | - | - |
| `total_amount_minor` | `INTEGER` | No | 0 | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `adults` | `INTEGER` | No | 1 | - |
| `children` | `INTEGER` | No | 0 | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000018",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "room_type_id": "00000000-0000-0000-0000-000000000012",
  "room_id": "00000000-0000-0000-0000-000000000013",
  "meal_plan_id": "00000000-0000-0000-0000-000000000014",
  "booking_reference": "HK-KZS-IN-001-0001",
  "booking_source": "Website",
  "guest_customer_id": "00000000-0000-0000-0000-000000000015",
  "guest_name": "Naina Sharma",
  "check_in_date": "2026-05-20",
  "check_out_date": "2026-05-23",
  "status": "checked_out",
  "special_requests": "Airport transfer and quiet room",
  "early_check_in": true,
  "late_check_out": false,
  "actual_check_in_at": "2026-05-20T08:15:00+00:00",
  "actual_check_out_at": "2026-05-23T05:40:00+00:00",
  "total_amount_minor": 6600000,
  "currency": "INR",
  "adults": 2,
  "children": 1,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_stays`

**Purpose:** Operational stay rows materialized after check-in.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `reservation_id` -> `hotel_reservations.id`, `room_type_id` -> `hotel_room_types.id`, `room_id` -> `hotel_rooms.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `reservation_id` | `VARCHAR(36)` | No | - | FK -> hotel_reservations.id; INDEX |
| `room_type_id` | `VARCHAR(36)` | No | - | FK -> hotel_room_types.id; INDEX |
| `room_id` | `VARCHAR(36)` | No | - | FK -> hotel_rooms.id; INDEX |
| `guest_customer_id` | `VARCHAR(120)` | No | - | - |
| `guest_name` | `VARCHAR(255)` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "in_house" | - |
| `checked_in_at` | `VARCHAR(64)` | No | - | - |
| `checked_out_at` | `VARCHAR(64)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000019",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "reservation_id": "00000000-0000-0000-0000-000000000018",
  "room_type_id": "00000000-0000-0000-0000-000000000012",
  "room_id": "00000000-0000-0000-0000-000000000013",
  "guest_customer_id": "00000000-0000-0000-0000-000000000015",
  "guest_name": "Naina Sharma",
  "status": "checked_out",
  "checked_in_at": "2026-05-20T08:15:00+00:00",
  "checked_out_at": "2026-05-23T05:40:00+00:00",
  "notes": "Late checkout approved by front desk",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_room_moves`

**Purpose:** Audit rows for in-stay room changes.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `stay_id` -> `hotel_stays.id`, `reservation_id` -> `hotel_reservations.id`, `from_room_id` -> `hotel_rooms.id`, `to_room_id` -> `hotel_rooms.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `stay_id` | `VARCHAR(36)` | No | - | FK -> hotel_stays.id; INDEX |
| `reservation_id` | `VARCHAR(36)` | No | - | FK -> hotel_reservations.id; INDEX |
| `from_room_id` | `VARCHAR(36)` | No | - | FK -> hotel_rooms.id; INDEX |
| `to_room_id` | `VARCHAR(36)` | No | - | FK -> hotel_rooms.id; INDEX |
| `moved_at` | `VARCHAR(64)` | No | - | - |
| `reason` | `VARCHAR(255)` | No | - | - |
| `moved_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000020",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "stay_id": "00000000-0000-0000-0000-000000000019",
  "reservation_id": "00000000-0000-0000-0000-000000000018",
  "from_room_id": "00000000-0000-0000-0000-000000000013",
  "to_room_id": "00000000-0000-0000-0000-000000000072",
  "moved_at": "2026-05-21T13:20:00+00:00",
  "reason": "VIP upgrade",
  "moved_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_guest_documents`

**Purpose:** Guest identity/KYC documents.

**Key relations:** `tenant_id` -> `tenants.id`, `guest_profile_id` -> `hotel_guest_profiles.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `guest_profile_id` | `VARCHAR(36)` | No | - | FK -> hotel_guest_profiles.id; INDEX |
| `document_kind` | `VARCHAR(64)` | No | - | - |
| `document_number` | `VARCHAR(120)` | No | - | - |
| `issuing_country` | `VARCHAR(120)` | Yes | - | - |
| `expires_on` | `DATE` | Yes | - | - |
| `verification_status` | `VARCHAR(32)` | No | "pending" | - |
| `storage_key` | `VARCHAR(255)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000021",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "guest_profile_id": "00000000-0000-0000-0000-000000000015",
  "document_kind": "passport",
  "document_number": "P1234567",
  "issuing_country": "India",
  "expires_on": "2031-01-01",
  "verification_status": "verified",
  "storage_key": "guest-docs/naina-passport.pdf",
  "notes": "Verified at check-in",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_folios`

**Purpose:** Billing headers for hotel reservations.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `reservation_id` -> `hotel_reservations.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `reservation_id` | `VARCHAR(36)` | No | - | FK -> hotel_reservations.id; INDEX |
| `guest_customer_id` | `VARCHAR(120)` | No | - | - |
| `guest_name` | `VARCHAR(255)` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "open" | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `subtotal_minor` | `INTEGER` | No | 0 | - |
| `tax_minor` | `INTEGER` | No | 0 | - |
| `total_minor` | `INTEGER` | No | 0 | - |
| `paid_minor` | `INTEGER` | No | 0 | - |
| `balance_minor` | `INTEGER` | No | 0 | - |
| `invoice_number` | `VARCHAR(64)` | Yes | - | - |
| `invoice_issued_at` | `VARCHAR(64)` | Yes | - | - |
| `closed_at` | `VARCHAR(64)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000022",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "reservation_id": "00000000-0000-0000-0000-000000000018",
  "guest_customer_id": "00000000-0000-0000-0000-000000000015",
  "guest_name": "Naina Sharma",
  "status": "invoiced",
  "currency": "INR",
  "subtotal_minor": 6750000,
  "tax_minor": 27000,
  "total_minor": 6777000,
  "paid_minor": 6777000,
  "balance_minor": 0,
  "invoice_number": "INV-HTL-0001",
  "invoice_issued_at": "2026-05-23T06:00:00+00:00",
  "closed_at": "2026-05-23T05:55:00+00:00",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_folio_charges`

**Purpose:** Line items posted onto hotel folios.

**Key relations:** `tenant_id` -> `tenants.id`, `folio_id` -> `hotel_folios.id`, `reservation_id` -> `hotel_reservations.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `folio_id` | `VARCHAR(36)` | No | - | FK -> hotel_folios.id; INDEX |
| `reservation_id` | `VARCHAR(36)` | No | - | FK -> hotel_reservations.id; INDEX |
| `category` | `VARCHAR(64)` | No | - | - |
| `label` | `VARCHAR(255)` | No | - | - |
| `service_date` | `DATE` | No | - | - |
| `quantity` | `INTEGER` | No | 1 | - |
| `unit_amount_minor` | `INTEGER` | No | - | - |
| `line_amount_minor` | `INTEGER` | No | - | - |
| `tax_amount_minor` | `INTEGER` | No | 0 | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000023",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "folio_id": "00000000-0000-0000-0000-000000000022",
  "reservation_id": "00000000-0000-0000-0000-000000000018",
  "category": "incidental",
  "label": "Mini bar consumption",
  "service_date": "2026-05-22",
  "quantity": 1,
  "unit_amount_minor": 150000,
  "line_amount_minor": 150000,
  "tax_amount_minor": 27000,
  "notes": "Soft drinks and snacks",
  "created_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_payments`

**Purpose:** Payments recorded against folios.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `folio_id` -> `hotel_folios.id`, `reservation_id` -> `hotel_reservations.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `folio_id` | `VARCHAR(36)` | No | - | FK -> hotel_folios.id; INDEX |
| `reservation_id` | `VARCHAR(36)` | No | - | FK -> hotel_reservations.id; INDEX |
| `amount_minor` | `INTEGER` | No | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `payment_method` | `VARCHAR(32)` | No | - | - |
| `status` | `VARCHAR(32)` | No | "posted" | - |
| `reference` | `VARCHAR(120)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `received_at` | `VARCHAR(64)` | No | - | - |
| `recorded_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000024",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "folio_id": "00000000-0000-0000-0000-000000000022",
  "reservation_id": "00000000-0000-0000-0000-000000000018",
  "amount_minor": 6777000,
  "currency": "INR",
  "payment_method": "card",
  "status": "posted",
  "reference": "CARD-8899",
  "notes": "Final settlement",
  "received_at": "2026-05-23T05:45:00+00:00",
  "recorded_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_refunds`

**Purpose:** Refunds recorded against folio payments.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `folio_id` -> `hotel_folios.id`, `payment_id` -> `hotel_payments.id`, `reservation_id` -> `hotel_reservations.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `folio_id` | `VARCHAR(36)` | No | - | FK -> hotel_folios.id; INDEX |
| `payment_id` | `VARCHAR(36)` | No | - | FK -> hotel_payments.id; INDEX |
| `reservation_id` | `VARCHAR(36)` | No | - | FK -> hotel_reservations.id; INDEX |
| `amount_minor` | `INTEGER` | No | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `reason` | `VARCHAR(255)` | No | - | - |
| `reference` | `VARCHAR(120)` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "processed" | - |
| `refunded_at` | `VARCHAR(64)` | No | - | - |
| `recorded_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000025",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "folio_id": "00000000-0000-0000-0000-000000000022",
  "payment_id": "00000000-0000-0000-0000-000000000024",
  "reservation_id": "00000000-0000-0000-0000-000000000018",
  "amount_minor": 200000,
  "currency": "INR",
  "reason": "Courtesy adjustment",
  "reference": "RF-001",
  "status": "processed",
  "refunded_at": "2026-05-23T05:50:00+00:00",
  "recorded_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_staff_members`

**Purpose:** Hotel staff directory.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `staff_code` | `VARCHAR(64)` | No | - | INDEX |
| `first_name` | `VARCHAR(120)` | No | - | - |
| `last_name` | `VARCHAR(120)` | No | - | - |
| `role` | `VARCHAR(120)` | No | - | - |
| `department` | `VARCHAR(120)` | No | - | - |
| `phone` | `VARCHAR(32)` | Yes | - | - |
| `email` | `VARCHAR(255)` | Yes | - | - |
| `employment_status` | `VARCHAR(32)` | No | "active" | - |
| `is_active` | `BOOLEAN` | No | true | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000026",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "staff_code": "HK-01",
  "first_name": "Asha",
  "last_name": "Patel",
  "role": "Housekeeping Supervisor",
  "department": "Housekeeping",
  "phone": "+919888888888",
  "email": "asha.patel@example.com",
  "employment_status": "active",
  "is_active": true,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_shifts`

**Purpose:** Shift roster entries for staff members.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `staff_member_id` -> `hotel_staff_members.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `staff_member_id` | `VARCHAR(36)` | No | - | FK -> hotel_staff_members.id; INDEX |
| `shift_date` | `DATE` | No | - | - |
| `shift_kind` | `VARCHAR(32)` | No | - | - |
| `start_time` | `VARCHAR(16)` | No | - | - |
| `end_time` | `VARCHAR(16)` | No | - | - |
| `status` | `VARCHAR(32)` | No | "scheduled" | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000027",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "staff_member_id": "00000000-0000-0000-0000-000000000026",
  "shift_date": "2026-07-10",
  "shift_kind": "morning",
  "start_time": "08:00",
  "end_time": "16:00",
  "status": "scheduled",
  "notes": "Standard housekeeping coverage",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_night_audits`

**Purpose:** Night-audit runs and their summary report.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `audit_date` | `DATE` | No | - | INDEX |
| `status` | `VARCHAR(32)` | No | "completed" | - |
| `report_json` | `JSON` | No | {} | - |
| `completed_at` | `VARCHAR(64)` | No | - | - |
| `completed_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000028",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "audit_date": "2026-07-22",
  "status": "completed",
  "report_json": {
    "open_folios_with_balance": 0,
    "occupancy_snapshot": {
      "in_house": 18,
      "vacant": 42
    }
  },
  "completed_at": "2026-07-22T18:30:00+00:00",
  "completed_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_housekeeping_tasks`

**Purpose:** Housekeeping work orders tied to rooms.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `room_id` -> `hotel_rooms.id`, `assigned_staff_id` -> `hotel_staff_members.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `room_id` | `VARCHAR(36)` | No | - | FK -> hotel_rooms.id; INDEX |
| `status` | `VARCHAR(32)` | No | "pending" | - |
| `priority` | `VARCHAR(32)` | No | "medium" | - |
| `notes` | `TEXT` | Yes | - | - |
| `assigned_staff_id` | `VARCHAR(36)` | Yes | - | FK -> hotel_staff_members.id |
| `assigned_to` | `VARCHAR(255)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000029",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "room_id": "00000000-0000-0000-0000-000000000013",
  "status": "pending",
  "priority": "high",
  "notes": "Rush clean before VIP arrival",
  "assigned_staff_id": "00000000-0000-0000-0000-000000000026",
  "assigned_to": "Asha Patel",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `hotel_maintenance_tickets`

**Purpose:** Maintenance/engineering tickets.

**Key relations:** `tenant_id` -> `tenants.id`, `property_id` -> `hotel_properties.id`, `room_id` -> `hotel_rooms.id`, `assigned_staff_id` -> `hotel_staff_members.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `property_id` | `VARCHAR(36)` | No | - | FK -> hotel_properties.id; INDEX |
| `room_id` | `VARCHAR(36)` | Yes | - | FK -> hotel_rooms.id |
| `title` | `VARCHAR(255)` | No | - | - |
| `description` | `TEXT` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "open" | - |
| `priority` | `VARCHAR(32)` | No | "medium" | - |
| `assigned_staff_id` | `VARCHAR(36)` | Yes | - | FK -> hotel_staff_members.id |
| `assigned_to` | `VARCHAR(255)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000030",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "property_id": "00000000-0000-0000-0000-000000000011",
  "room_id": "00000000-0000-0000-0000-000000000013",
  "title": "Bathroom fixture repair",
  "description": "Leaking faucet detected.",
  "status": "open",
  "priority": "medium",
  "assigned_staff_id": null,
  "assigned_to": "Vikram Rao",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

## Commerce

### `commerce_categories`

**Purpose:** Hierarchical catalog taxonomy.

**Key relations:** `tenant_id` -> `tenants.id`, `parent_category_id` -> `commerce_categories.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `parent_category_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_categories.id |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000031",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Footwear",
  "slug": "footwear",
  "description": "Retail catalog for shoes.",
  "parent_category_id": null,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_brands`

**Purpose:** Commerce brand master records.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `code` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000032",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Kalp Athletics",
  "slug": "kalp-athletics",
  "code": "KALP",
  "description": "Private-label performance brand.",
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_vendors`

**Purpose:** Supplier/vendor master records.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `code` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `contact_name` | `VARCHAR(255)` | Yes | - | - |
| `contact_email` | `VARCHAR(255)` | Yes | - | - |
| `contact_phone` | `VARCHAR(64)` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000033",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Prime Supply Co",
  "slug": "prime-supply",
  "code": "SUP-001",
  "description": "Primary vendor for core SKUs.",
  "contact_name": "Riya Sharma",
  "contact_email": "supply@example.com",
  "contact_phone": "+919555000111",
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_collections`

**Purpose:** Merchandising collections or campaign groupings.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `sort_order` | `INTEGER` | No | 0 | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000034",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Summer Launch",
  "slug": "summer-launch",
  "description": "Seasonal hero collection.",
  "status": "active",
  "sort_order": 1,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_attributes`

**Purpose:** Reusable product/variant attributes.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `code` | `VARCHAR(120)` | No | - | INDEX |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `label` | `VARCHAR(255)` | No | - | - |
| `description` | `TEXT` | Yes | - | - |
| `value_type` | `VARCHAR(32)` | No | - | - |
| `scope` | `VARCHAR(32)` | No | "product" | - |
| `options_json` | `JSON` | No | [] | - |
| `unit_label` | `VARCHAR(64)` | Yes | - | - |
| `is_required` | `BOOLEAN` | No | false | - |
| `is_filterable` | `BOOLEAN` | No | false | - |
| `is_variation_axis` | `BOOLEAN` | No | false | - |
| `vertical_bindings` | `JSON` | No | [] | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000035",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "code": "material",
  "slug": "material",
  "label": "Material",
  "description": "Primary product material.",
  "value_type": "single_select",
  "scope": "product",
  "options_json": [
    {
      "value": "mesh",
      "label": "Mesh"
    },
    {
      "value": "leather",
      "label": "Leather"
    }
  ],
  "unit_label": null,
  "is_required": true,
  "is_filterable": true,
  "is_variation_axis": false,
  "vertical_bindings": [
    "commerce"
  ],
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_attribute_sets`

**Purpose:** Named bundles of attributes for product families.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `attribute_ids` | `JSON` | No | [] | - |
| `vertical_bindings` | `JSON` | No | [] | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000036",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Footwear Core",
  "slug": "footwear-core",
  "description": "Reusable attribute set for footwear products.",
  "attribute_ids": [
    "00000000-0000-0000-0000-000000000035",
    "00000000-0000-0000-0000-000000000073",
    "00000000-0000-0000-0000-000000000074"
  ],
  "vertical_bindings": [
    "commerce"
  ],
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_products`

**Purpose:** Product master records.

**Key relations:** `tenant_id` -> `tenants.id`, `brand_id` -> `commerce_brands.id`, `vendor_id` -> `commerce_vendors.id`, `attribute_set_id` -> `commerce_attribute_sets.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `brand_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_brands.id |
| `vendor_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_vendors.id |
| `collection_ids` | `JSON` | No | [] | - |
| `attribute_set_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_attribute_sets.id |
| `category_ids` | `JSON` | No | [] | - |
| `seo_title` | `VARCHAR(255)` | Yes | - | - |
| `seo_description` | `TEXT` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000037",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "KalpZero Runner",
  "slug": "kalpzero-runner",
  "description": "Everyday performance sneaker.",
  "brand_id": "00000000-0000-0000-0000-000000000032",
  "vendor_id": "00000000-0000-0000-0000-000000000033",
  "collection_ids": [
    "00000000-0000-0000-0000-000000000034"
  ],
  "attribute_set_id": "00000000-0000-0000-0000-000000000036",
  "category_ids": [
    "00000000-0000-0000-0000-000000000031"
  ],
  "seo_title": "KalpZero Runner Shoe",
  "seo_description": "Performance footwear for daily runs.",
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_variants`

**Purpose:** Sellable SKU-level variants.

**Key relations:** `tenant_id` -> `tenants.id`, `product_id` -> `commerce_products.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `product_id` | `VARCHAR(36)` | No | - | FK -> commerce_products.id; INDEX |
| `sku` | `VARCHAR(120)` | No | - | INDEX |
| `label` | `VARCHAR(255)` | No | - | - |
| `price_minor` | `INTEGER` | No | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `inventory_quantity` | `INTEGER` | No | 0 | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000038",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "product_id": "00000000-0000-0000-0000-000000000037",
  "sku": "RUN-42-BLK",
  "label": "Black / 42",
  "price_minor": 349900,
  "currency": "INR",
  "inventory_quantity": 20,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_warehouses`

**Purpose:** Warehouse/location master.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `code` | `VARCHAR(120)` | No | - | INDEX |
| `city` | `VARCHAR(120)` | Yes | - | - |
| `country` | `VARCHAR(120)` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `is_default` | `BOOLEAN` | No | false | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000039",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Primary DC",
  "slug": "primary-dc",
  "code": "PDC",
  "city": "Jaipur",
  "country": "India",
  "status": "active",
  "is_default": true,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_warehouse_stocks`

**Purpose:** Per-warehouse stock balances for variants.

**Key relations:** `tenant_id` -> `tenants.id`, `warehouse_id` -> `commerce_warehouses.id`, `variant_id` -> `commerce_variants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `warehouse_id` | `VARCHAR(36)` | No | - | FK -> commerce_warehouses.id; INDEX |
| `variant_id` | `VARCHAR(36)` | No | - | FK -> commerce_variants.id; INDEX |
| `on_hand_quantity` | `INTEGER` | No | 0 | - |
| `reserved_quantity` | `INTEGER` | No | 0 | - |
| `low_stock_threshold` | `INTEGER` | No | 0 | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000040",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "warehouse_id": "00000000-0000-0000-0000-000000000039",
  "variant_id": "00000000-0000-0000-0000-000000000038",
  "on_hand_quantity": 20,
  "reserved_quantity": 3,
  "low_stock_threshold": 5,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_stock_ledger_entries`

**Purpose:** Inventory movement log.

**Key relations:** `tenant_id` -> `tenants.id`, `warehouse_id` -> `commerce_warehouses.id`, `variant_id` -> `commerce_variants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `warehouse_id` | `VARCHAR(36)` | No | - | FK -> commerce_warehouses.id; INDEX |
| `variant_id` | `VARCHAR(36)` | No | - | FK -> commerce_variants.id; INDEX |
| `entry_type` | `VARCHAR(32)` | No | - | - |
| `quantity_delta` | `INTEGER` | No | - | - |
| `balance_after` | `INTEGER` | No | - | - |
| `reserved_after` | `INTEGER` | No | 0 | - |
| `reference_type` | `VARCHAR(64)` | Yes | - | - |
| `reference_id` | `VARCHAR(120)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `recorded_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000041",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "warehouse_id": "00000000-0000-0000-0000-000000000039",
  "variant_id": "00000000-0000-0000-0000-000000000038",
  "entry_type": "reservation",
  "quantity_delta": -3,
  "balance_after": 20,
  "reserved_after": 3,
  "reference_type": "commerce_order",
  "reference_id": "00000000-0000-0000-0000-000000000048",
  "notes": "Reserved inventory for order ORD-0001.",
  "recorded_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_product_attribute_values`

**Purpose:** Product-scoped attribute values.

**Key relations:** `tenant_id` -> `tenants.id`, `product_id` -> `commerce_products.id`, `attribute_id` -> `commerce_attributes.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `product_id` | `VARCHAR(36)` | No | - | FK -> commerce_products.id; INDEX |
| `attribute_id` | `VARCHAR(36)` | No | - | FK -> commerce_attributes.id; INDEX |
| `value_json` | `JSON` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000042",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "product_id": "00000000-0000-0000-0000-000000000037",
  "attribute_id": "00000000-0000-0000-0000-000000000035",
  "value_json": "mesh",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_variant_attribute_values`

**Purpose:** Variant-scoped attribute values.

**Key relations:** `tenant_id` -> `tenants.id`, `variant_id` -> `commerce_variants.id`, `attribute_id` -> `commerce_attributes.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `variant_id` | `VARCHAR(36)` | No | - | FK -> commerce_variants.id; INDEX |
| `attribute_id` | `VARCHAR(36)` | No | - | FK -> commerce_attributes.id; INDEX |
| `value_json` | `JSON` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000043",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "variant_id": "00000000-0000-0000-0000-000000000038",
  "attribute_id": "00000000-0000-0000-0000-000000000035",
  "value_json": "black",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_tax_profiles`

**Purpose:** Tax-rule sets used by orders.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `code` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `prices_include_tax` | `BOOLEAN` | No | false | - |
| `rules_json` | `JSON` | No | [] | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000044",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "GST 18",
  "code": "GST18",
  "description": "Standard GST rate for catalog sales.",
  "prices_include_tax": false,
  "rules_json": [
    {
      "label": "GST",
      "rate_basis_points": 1800
    }
  ],
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_price_lists`

**Purpose:** Alternative/channel-specific pricing books.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `name` | `VARCHAR(255)` | No | - | - |
| `slug` | `VARCHAR(120)` | No | - | INDEX |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `customer_segment` | `VARCHAR(120)` | Yes | - | - |
| `description` | `TEXT` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000045",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "name": "Retail Default",
  "slug": "retail-default",
  "currency": "INR",
  "customer_segment": "retail",
  "description": "Standard retail price list.",
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_price_list_items`

**Purpose:** Variant price overrides inside price lists.

**Key relations:** `tenant_id` -> `tenants.id`, `price_list_id` -> `commerce_price_lists.id`, `variant_id` -> `commerce_variants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `price_list_id` | `VARCHAR(36)` | No | - | FK -> commerce_price_lists.id; INDEX |
| `variant_id` | `VARCHAR(36)` | No | - | FK -> commerce_variants.id; INDEX |
| `price_minor` | `INTEGER` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000046",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "price_list_id": "00000000-0000-0000-0000-000000000045",
  "variant_id": "00000000-0000-0000-0000-000000000038",
  "price_minor": 339900,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_coupons`

**Purpose:** Discount definitions and scope.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `code` | `VARCHAR(120)` | No | - | INDEX |
| `description` | `TEXT` | Yes | - | - |
| `discount_type` | `VARCHAR(32)` | No | - | - |
| `discount_value` | `INTEGER` | No | - | - |
| `minimum_subtotal_minor` | `INTEGER` | No | 0 | - |
| `maximum_discount_minor` | `INTEGER` | Yes | - | - |
| `applicable_category_ids` | `JSON` | No | [] | - |
| `applicable_variant_ids` | `JSON` | No | [] | - |
| `status` | `VARCHAR(32)` | No | "active" | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000047",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "code": "WELCOME10",
  "description": "Launch coupon for first-time buyers.",
  "discount_type": "percent",
  "discount_value": 1000,
  "minimum_subtotal_minor": 200000,
  "maximum_discount_minor": null,
  "applicable_category_ids": [
    "00000000-0000-0000-0000-000000000031"
  ],
  "applicable_variant_ids": [
    "00000000-0000-0000-0000-000000000038"
  ],
  "status": "active",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_orders`

**Purpose:** Order headers with pricing and finance summary.

**Key relations:** `tenant_id` -> `tenants.id`, `price_list_id` -> `commerce_price_lists.id`, `tax_profile_id` -> `commerce_tax_profiles.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `customer_id` | `VARCHAR(120)` | No | - | - |
| `price_list_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_price_lists.id |
| `tax_profile_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_tax_profiles.id |
| `coupon_code` | `VARCHAR(120)` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "placed" | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `subtotal_minor` | `INTEGER` | No | 0 | - |
| `discount_minor` | `INTEGER` | No | 0 | - |
| `tax_minor` | `INTEGER` | No | 0 | - |
| `total_minor` | `INTEGER` | No | 0 | - |
| `payment_status` | `VARCHAR(32)` | No | "pending" | - |
| `paid_minor` | `INTEGER` | No | 0 | - |
| `refunded_minor` | `INTEGER` | No | 0 | - |
| `balance_minor` | `INTEGER` | No | 0 | - |
| `invoice_number` | `VARCHAR(64)` | Yes | - | - |
| `invoice_issued_at` | `VARCHAR(64)` | Yes | - | - |
| `inventory_reserved` | `BOOLEAN` | No | false | - |
| `placed_at` | `VARCHAR(64)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000048",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "customer_id": "cust_finance_01",
  "price_list_id": null,
  "tax_profile_id": null,
  "coupon_code": null,
  "status": "fulfilled",
  "currency": "INR",
  "subtotal_minor": 20000,
  "discount_minor": 0,
  "tax_minor": 0,
  "total_minor": 20000,
  "payment_status": "partially_refunded",
  "paid_minor": 20000,
  "refunded_minor": 3000,
  "balance_minor": 0,
  "invoice_number": "INV-COM-0001",
  "invoice_issued_at": "2026-04-15T12:21:00+00:00",
  "inventory_reserved": true,
  "placed_at": "2026-04-15T12:15:00+00:00",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_order_lines`

**Purpose:** Line items inside an order.

**Key relations:** `order_id` -> `commerce_orders.id`, `tenant_id` -> `tenants.id`, `product_id` -> `commerce_products.id`, `variant_id` -> `commerce_variants.id`, `allocated_warehouse_id` -> `commerce_warehouses.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `order_id` | `VARCHAR(36)` | No | - | FK -> commerce_orders.id; INDEX |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `product_id` | `VARCHAR(36)` | No | - | FK -> commerce_products.id; INDEX |
| `variant_id` | `VARCHAR(36)` | No | - | FK -> commerce_variants.id; INDEX |
| `allocated_warehouse_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_warehouses.id |
| `quantity` | `INTEGER` | No | - | - |
| `fulfilled_quantity` | `INTEGER` | No | 0 | - |
| `unit_price_minor` | `INTEGER` | No | - | - |
| `line_total_minor` | `INTEGER` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000049",
  "order_id": "00000000-0000-0000-0000-000000000048",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "product_id": "00000000-0000-0000-0000-000000000037",
  "variant_id": "00000000-0000-0000-0000-000000000038",
  "allocated_warehouse_id": "00000000-0000-0000-0000-000000000039",
  "quantity": 1,
  "fulfilled_quantity": 1,
  "unit_price_minor": 20000,
  "line_total_minor": 20000,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_fulfillments`

**Purpose:** Pick/pack/ship batches for orders.

**Key relations:** `tenant_id` -> `tenants.id`, `order_id` -> `commerce_orders.id`, `warehouse_id` -> `commerce_warehouses.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `order_id` | `VARCHAR(36)` | No | - | FK -> commerce_orders.id; INDEX |
| `warehouse_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_warehouses.id |
| `fulfillment_number` | `VARCHAR(64)` | No | - | INDEX |
| `status` | `VARCHAR(32)` | No | "pending_pick" | - |
| `created_by_user_id` | `VARCHAR(255)` | No | - | - |
| `packed_at` | `VARCHAR(64)` | Yes | - | - |
| `shipped_at` | `VARCHAR(64)` | Yes | - | - |
| `delivered_at` | `VARCHAR(64)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000050",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "order_id": "00000000-0000-0000-0000-000000000048",
  "warehouse_id": "00000000-0000-0000-0000-000000000039",
  "fulfillment_number": "FUL-0001",
  "status": "delivered",
  "created_by_user_id": "ops@tenant.com",
  "packed_at": "2026-04-15T12:16:00+00:00",
  "shipped_at": "2026-04-15T12:17:00+00:00",
  "delivered_at": "2026-04-16T05:30:00+00:00",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_fulfillment_lines`

**Purpose:** Specific quantities included in a fulfillment.

**Key relations:** `tenant_id` -> `tenants.id`, `fulfillment_id` -> `commerce_fulfillments.id`, `order_line_id` -> `commerce_order_lines.id`, `variant_id` -> `commerce_variants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `fulfillment_id` | `VARCHAR(36)` | No | - | FK -> commerce_fulfillments.id; INDEX |
| `order_line_id` | `VARCHAR(36)` | No | - | FK -> commerce_order_lines.id; INDEX |
| `variant_id` | `VARCHAR(36)` | No | - | FK -> commerce_variants.id; INDEX |
| `quantity` | `INTEGER` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000051",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "fulfillment_id": "00000000-0000-0000-0000-000000000050",
  "order_line_id": "00000000-0000-0000-0000-000000000049",
  "variant_id": "00000000-0000-0000-0000-000000000038",
  "quantity": 1,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_shipments`

**Purpose:** Carrier/tracking records tied to fulfillments.

**Key relations:** `tenant_id` -> `tenants.id`, `fulfillment_id` -> `commerce_fulfillments.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `fulfillment_id` | `VARCHAR(36)` | No | - | FK -> commerce_fulfillments.id; INDEX |
| `carrier` | `VARCHAR(120)` | No | - | - |
| `service_level` | `VARCHAR(120)` | Yes | - | - |
| `tracking_number` | `VARCHAR(120)` | No | - | INDEX |
| `status` | `VARCHAR(32)` | No | "shipped" | - |
| `shipped_at` | `VARCHAR(64)` | Yes | - | - |
| `delivered_at` | `VARCHAR(64)` | Yes | - | - |
| `metadata_json` | `JSON` | No | {} | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000052",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "fulfillment_id": "00000000-0000-0000-0000-000000000050",
  "carrier": "Delhivery",
  "service_level": "express",
  "tracking_number": "TRK-001",
  "status": "delivered",
  "shipped_at": "2026-04-15T12:17:00+00:00",
  "delivered_at": "2026-04-16T05:30:00+00:00",
  "metadata_json": {
    "awb": "AWB001"
  },
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_payments`

**Purpose:** Authorized/captured order payments.

**Key relations:** `tenant_id` -> `tenants.id`, `order_id` -> `commerce_orders.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `order_id` | `VARCHAR(36)` | No | - | FK -> commerce_orders.id; INDEX |
| `amount_minor` | `INTEGER` | No | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `provider` | `VARCHAR(120)` | Yes | - | - |
| `payment_method` | `VARCHAR(32)` | No | - | - |
| `status` | `VARCHAR(32)` | No | "captured" | - |
| `reference` | `VARCHAR(120)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `received_at` | `VARCHAR(64)` | No | - | - |
| `recorded_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000053",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "order_id": "00000000-0000-0000-0000-000000000048",
  "amount_minor": 20000,
  "currency": "INR",
  "provider": "razorpay",
  "payment_method": "card",
  "status": "captured",
  "reference": "cap_001",
  "notes": null,
  "received_at": "2026-04-15T12:19:00+00:00",
  "recorded_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_refunds`

**Purpose:** Order payment refunds.

**Key relations:** `tenant_id` -> `tenants.id`, `order_id` -> `commerce_orders.id`, `payment_id` -> `commerce_payments.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `order_id` | `VARCHAR(36)` | No | - | FK -> commerce_orders.id; INDEX |
| `payment_id` | `VARCHAR(36)` | No | - | FK -> commerce_payments.id; INDEX |
| `amount_minor` | `INTEGER` | No | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `reason` | `VARCHAR(255)` | No | - | - |
| `reference` | `VARCHAR(120)` | Yes | - | - |
| `status` | `VARCHAR(32)` | No | "processed" | - |
| `refunded_at` | `VARCHAR(64)` | No | - | - |
| `recorded_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000054",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "order_id": "00000000-0000-0000-0000-000000000048",
  "payment_id": "00000000-0000-0000-0000-000000000053",
  "amount_minor": 3000,
  "currency": "INR",
  "reason": "Damaged shipment compensation",
  "reference": "refund_001",
  "status": "processed",
  "refunded_at": "2026-04-15T12:22:00+00:00",
  "recorded_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_invoices`

**Purpose:** Issued order invoices.

**Key relations:** `tenant_id` -> `tenants.id`, `order_id` -> `commerce_orders.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `order_id` | `VARCHAR(36)` | No | - | FK -> commerce_orders.id; INDEX |
| `customer_id` | `VARCHAR(120)` | No | - | - |
| `invoice_number` | `VARCHAR(64)` | No | - | INDEX |
| `status` | `VARCHAR(32)` | No | "issued" | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `subtotal_minor` | `INTEGER` | No | 0 | - |
| `discount_minor` | `INTEGER` | No | 0 | - |
| `tax_minor` | `INTEGER` | No | 0 | - |
| `total_minor` | `INTEGER` | No | 0 | - |
| `issued_at` | `VARCHAR(64)` | No | - | - |
| `issued_by_user_id` | `VARCHAR(255)` | No | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000055",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "order_id": "00000000-0000-0000-0000-000000000048",
  "customer_id": "cust_finance_01",
  "invoice_number": "INV-COM-0001",
  "status": "issued",
  "currency": "INR",
  "subtotal_minor": 20000,
  "discount_minor": 0,
  "tax_minor": 0,
  "total_minor": 20000,
  "issued_at": "2026-04-15T12:21:00+00:00",
  "issued_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_returns`

**Purpose:** Customer return requests and lifecycle state.

**Key relations:** `tenant_id` -> `tenants.id`, `order_id` -> `commerce_orders.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `order_id` | `VARCHAR(36)` | No | - | FK -> commerce_orders.id; INDEX |
| `return_number` | `VARCHAR(64)` | No | - | INDEX |
| `status` | `VARCHAR(32)` | No | "requested" | - |
| `reason_summary` | `VARCHAR(255)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `inventory_restocked` | `BOOLEAN` | No | false | - |
| `requested_at` | `VARCHAR(64)` | No | - | - |
| `approved_at` | `VARCHAR(64)` | Yes | - | - |
| `received_at` | `VARCHAR(64)` | Yes | - | - |
| `closed_at` | `VARCHAR(64)` | Yes | - | - |
| `created_by_user_id` | `VARCHAR(255)` | No | - | - |
| `closed_by_user_id` | `VARCHAR(255)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000056",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "order_id": "00000000-0000-0000-0000-000000000048",
  "return_number": "RET-0001",
  "status": "completed",
  "reason_summary": "Customer requested a replacement",
  "notes": "One unit came back sealed.",
  "inventory_restocked": true,
  "requested_at": "2026-04-16T07:00:00+00:00",
  "approved_at": "2026-04-16T09:00:00+00:00",
  "received_at": "2026-04-18T10:30:00+00:00",
  "closed_at": "2026-04-18T10:45:00+00:00",
  "created_by_user_id": "ops@tenant.com",
  "closed_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_return_lines`

**Purpose:** Line-level resolution rows for returns.

**Key relations:** `tenant_id` -> `tenants.id`, `return_id` -> `commerce_returns.id`, `order_line_id` -> `commerce_order_lines.id`, `variant_id` -> `commerce_variants.id`, `replacement_variant_id` -> `commerce_variants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `return_id` | `VARCHAR(36)` | No | - | FK -> commerce_returns.id; INDEX |
| `order_line_id` | `VARCHAR(36)` | No | - | FK -> commerce_order_lines.id; INDEX |
| `variant_id` | `VARCHAR(36)` | No | - | FK -> commerce_variants.id; INDEX |
| `quantity` | `INTEGER` | No | - | - |
| `resolution_type` | `VARCHAR(32)` | No | - | - |
| `replacement_variant_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_variants.id |
| `restock_on_receive` | `BOOLEAN` | No | true | - |
| `line_amount_minor` | `INTEGER` | No | 0 | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000057",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "return_id": "00000000-0000-0000-0000-000000000056",
  "order_line_id": "00000000-0000-0000-0000-000000000049",
  "variant_id": "00000000-0000-0000-0000-000000000038",
  "quantity": 1,
  "resolution_type": "refund",
  "replacement_variant_id": null,
  "restock_on_receive": true,
  "line_amount_minor": 20000,
  "notes": "Customer preferred refund over exchange",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_settlements`

**Purpose:** Payout/reconciliation batches.

**Key relations:** `tenant_id` -> `tenants.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `settlement_number` | `VARCHAR(64)` | No | - | INDEX |
| `provider` | `VARCHAR(120)` | No | - | - |
| `settlement_reference` | `VARCHAR(120)` | Yes | - | - |
| `currency` | `VARCHAR(8)` | No | "INR" | - |
| `status` | `VARCHAR(32)` | No | "reported" | - |
| `payments_minor` | `INTEGER` | No | 0 | - |
| `refunds_minor` | `INTEGER` | No | 0 | - |
| `fees_minor` | `INTEGER` | No | 0 | - |
| `adjustments_minor` | `INTEGER` | No | 0 | - |
| `net_minor` | `INTEGER` | No | 0 | - |
| `reported_at` | `VARCHAR(64)` | No | - | - |
| `reconciled_at` | `VARCHAR(64)` | Yes | - | - |
| `closed_at` | `VARCHAR(64)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_by_user_id` | `VARCHAR(255)` | No | - | - |
| `closed_by_user_id` | `VARCHAR(255)` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000058",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "settlement_number": "STL-0001",
  "provider": "razorpay",
  "settlement_reference": "settl_001",
  "currency": "INR",
  "status": "closed",
  "payments_minor": 20000,
  "refunds_minor": 3000,
  "fees_minor": 500,
  "adjustments_minor": 200,
  "net_minor": 16700,
  "reported_at": "2026-04-15T18:00:00+00:00",
  "reconciled_at": "2026-04-16T06:00:00+00:00",
  "closed_at": "2026-04-16T07:00:00+00:00",
  "notes": "Daily payout batch",
  "created_by_user_id": "ops@tenant.com",
  "closed_by_user_id": "ops@tenant.com",
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

### `commerce_settlement_entries`

**Purpose:** Payments/refunds/fees/adjustments inside a settlement.

**Key relations:** `tenant_id` -> `tenants.id`, `settlement_id` -> `commerce_settlements.id`, `payment_id` -> `commerce_payments.id`, `refund_id` -> `commerce_refunds.id`

| Column | Type | Nullable | Default / Auto Value | Constraints |
| --- | --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | No | auto UUID | PK |
| `tenant_id` | `VARCHAR(36)` | No | - | FK -> tenants.id; INDEX |
| `settlement_id` | `VARCHAR(36)` | No | - | FK -> commerce_settlements.id; INDEX |
| `entry_type` | `VARCHAR(32)` | No | - | - |
| `payment_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_payments.id; INDEX |
| `refund_id` | `VARCHAR(36)` | Yes | - | FK -> commerce_refunds.id; INDEX |
| `amount_minor` | `INTEGER` | No | - | - |
| `label` | `VARCHAR(255)` | Yes | - | - |
| `notes` | `TEXT` | Yes | - | - |
| `created_at` | `DATETIME` | No | current UTC datetime | - |

**Example row**

```json
{
  "id": "00000000-0000-0000-0000-000000000059",
  "tenant_id": "00000000-0000-0000-0000-000000000002",
  "settlement_id": "00000000-0000-0000-0000-000000000058",
  "entry_type": "payment",
  "payment_id": "00000000-0000-0000-0000-000000000053",
  "refund_id": null,
  "amount_minor": 20000,
  "label": "Payment cap_001",
  "notes": null,
  "created_at": "2026-04-15T08:30:00+00:00"
}
```

## Appendix: Runtime Mongo Collections

The API also provisions runtime Mongo collections from `apps/api/app/db/mongo.py`. These are not SQL tables, but they are part of the storage model used by `apps/api`.

- `business_blueprints`
- `site_pages`
- `discovery_profiles`
- `builder_pages`
- `form_responses`
- `ai_knowledge_documents`
- `import_staging_documents`
- `discovery_snapshots`
- `hotel_property_profiles`
- `hotel_amenity_catalogs`
- `hotel_nearby_places`

Each tenant runtime collection gets a unique `(tenant_slug, document_key)` index and stores documents in a shape like this:

```json
{
  "_id": "hotel_public:stay",
  "tenant_slug": "hotel_public",
  "document_key": "stay",
  "payload": {
    "title": "KalpZero Heritage House",
    "hero_summary": "Lake-facing heritage hospitality",
    "blocks": [
      {
        "id": "hotel-profile",
        "kind": "hero"
      },
      {
        "id": "hotel-amenities",
        "kind": "amenities"
      },
      {
        "id": "hotel-nearby",
        "kind": "nearby"
      }
    ]
  },
  "updated_at": "2026-04-15T12:30:00+00:00"
}
```
