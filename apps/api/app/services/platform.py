from urllib.parse import urlparse
from sqlalchemy.orm import Session
from app.core.config import Settings
from app.db.mongo import (
    build_runtime_database_name,
    describe_tenant_runtime_document_store,
    get_runtime_document_store,
    get_runtime_mongo_database,
    provision_runtime_document_store_for_tenant,
    RuntimeDocumentStore,
)
from app.core.config import Settings, get_settings
from app.repositories import platform as platform_repository
from app.services.errors import ConflictError, NotFoundError, ValidationError
from app.services.website_provisioning import (
    get_missing_website_automation_settings,
    provision_business_website,
    serialize_website_deployment,
)
from app.utlis.utlis import serialize_mongo
from pymongo import ReturnDocument
from app.schemas.requests import (
    BusinessBlueprintPayloadRequest,
)
from datetime import datetime, UTC
from typing import Any

BASE_MODULES = [
    "platform.auth",
    "platform.registry",
    "platform.audit",
    "imports.pipeline",
    "publishing.pages",
    "ai.runtime",
]

VERTICAL_MODULES = {
    "commerce": [
        "commerce.catalog",
        "commerce.inventory",
        "commerce.orders",
        "commerce.fulfillment",
        "commerce.finance",
    ],
    "travel": ["travel.packages", "travel.leads"],
    "hotel": [
        "hotel.properties",
        "hotel.inventory",
        "hotel.reservations",
        "hotel.operations",
    ],
    "real_estate": ["real_estate.inventory"],
    "clinic": ["clinic.appointments"],
    "single_doctor": ["single_doctor.website"],
    "school": ["school.operations"],
    "lms": ["lms.learning"],
}

BASE_FEATURES = [
    "hybrid-tenancy",
    "fail-closed-rbac",
    "import-dry-run",
    "outbox-events",
    "tenant-ai-governance",
]

ONBOARDING_VERTICALS = {"commerce", "hotel"}
KNOWN_VERTICALS = set(VERTICAL_MODULES.keys())
VERTICAL_READINESS = {
    "commerce": {
        "status": "pilot_ready",
        "modules": VERTICAL_MODULES["commerce"],
        "capabilities": [
            "catalog governance",
            "warehouse and stock control",
            "fulfillment and shipment operations",
            "pricing and tax",
            "payments and refunds",
            "invoice issuance",
        ],
    },
    "hotel": {
        "status": "pilot_ready",
        "modules": VERTICAL_MODULES["hotel"],
        "capabilities": [
            "property and inventory",
            "reservation lifecycle",
            "operations and staff",
            "folio, payment, refund, and invoice",
        ],
    },
    "travel": {
        "status": "in_progress",
        "modules": VERTICAL_MODULES["travel"],
        "capabilities": [
            "packages and departures",
            "lead pipeline",
        ],
    },
}


def serialize_agency(agency) -> dict[str, object]:
    return {
        "id": str(agency.id),
        "slug": agency.slug,
        "name": agency.name,
        "region": agency.region,
        "owner_user_id": str(agency.owner_user_id),
        "created_at": agency.created_at.isoformat(),
    }


def serialize_tenant(
    tenant,
    *,
    settings: Settings | None = None,
    bootstrap: dict[str, object] | None = None,
    website_deployment=None,
) -> dict[str, object]:
    vertical_packs = tenant.vertical_packs if isinstance(tenant.vertical_packs, list) else [tenant.vertical_packs]
    payload = {
        "id": str(tenant.id),
        "agency_id": str(tenant.agency_id),
        "slug": tenant.slug,
        "display_name": tenant.display_name,
        "infra_mode": tenant.infra_mode,
        "vertical_packs": vertical_packs,
        "business_type": tenant.business_type,
        "feature_flags": tenant.feature_flags,
        "dedicated_profile_id": str(tenant.dedicated_profile_id) if tenant.dedicated_profile_id else None,
        "mongo_db_name": tenant.mongo_db_name,
        "created_at": tenant.created_at.isoformat(),
    }
    if settings is not None:
        resolved_bootstrap = bootstrap
        if resolved_bootstrap is None:
            from app.services import publishing as publishing_service

            resolved_bootstrap = publishing_service.summarize_tenant_runtime_documents(
                get_runtime_document_store(settings),
                tenant_slug=tenant.slug,
                database_name=tenant.mongo_db_name,
            )

        payload["runtime_documents"] = {
            **describe_tenant_runtime_document_store(settings, tenant_slug=tenant.slug),
            "bootstrap": resolved_bootstrap,
        }
    payload["website_deployment"] = serialize_website_deployment(website_deployment)
    return payload


def serialize_audit_event(event) -> dict[str, object]:
    return {
        "id": str(event.id),
        "tenant_id": str(event.tenant_id) if event.tenant_id else None,
        "actor_user_id": str(event.actor_user_id),
        "action": event.action,
        "subject_type": event.subject_type,
        "subject_id": str(event.subject_id),
        "metadata": event.metadata_json,
        "created_at": event.created_at.isoformat(),
    }


def serialize_outbox_event(event) -> dict[str, object]:
    return {
        "id": str(event.id),
        "tenant_id": str(event.tenant_id) if event.tenant_id else None,
        "aggregate_id": str(event.aggregate_id),
        "event_name": event.event_name,
        "payload": event.payload_json,
        "status": event.status,
        "created_at": event.created_at.isoformat(),
    }


def _url_scheme(url: str) -> str:
    parsed = urlparse(url)
    if "+" in parsed.scheme:
        return parsed.scheme.split("+", maxsplit=1)[0]
    return parsed.scheme


def get_onboarding_readiness(
    settings: Settings,
    *,
    requested_vertical_pack: str | None = None,
    requested_vertical_packs: list[str] | None = None,
    infra_mode: str | None = None,
    dedicated_profile_id: str | None = None,
) -> dict[str, object]:
    requested_verticals: list[str] = []
    for vertical in [requested_vertical_pack, *(requested_vertical_packs or [])]:
        if vertical and vertical not in requested_verticals:
            requested_verticals.append(vertical)
    blockers: list[str] = []
    warnings: list[str] = []
    checks: list[dict[str, str]] = []

    is_test_env = settings.env == "test"

    control_driver = _url_scheme(settings.control_database_url)
    if control_driver == "sqlite":
        message = "Control plane is running on SQLite. Business onboarding requires Postgres."
        if is_test_env:
            warnings.append(message)
            checks.append({"key": "control_plane", "status": "warn", "detail": message})
        else:
            blockers.append(message)
            checks.append({"key": "control_plane", "status": "fail", "detail": message})
    else:
        checks.append({"key": "control_plane", "status": "pass", "detail": f"Control plane driver is {control_driver}."})

    runtime_mode = settings.runtime_doc_store_mode
    if runtime_mode != "mongo":
        message = f"Runtime document store mode is '{runtime_mode}'. Business onboarding requires 'mongo'."
        if is_test_env:
            warnings.append(message)
            checks.append({"key": "runtime_documents", "status": "warn", "detail": message})
        else:
            blockers.append(message)
            checks.append({"key": "runtime_documents", "status": "fail", "detail": message})
    else:
        checks.append({"key": "runtime_documents", "status": "pass", "detail": "Runtime documents are configured for MongoDB."})

    ops_driver = _url_scheme(settings.ops_redis_url)
    if ops_driver != "redis":
        message = f"Ops cache and queue driver is '{ops_driver}'. Business onboarding requires Redis."
        blockers.append(message)
        checks.append({"key": "ops_cache_queue", "status": "fail", "detail": message})
    else:
        checks.append({"key": "ops_cache_queue", "status": "pass", "detail": "Ops cache and queue are configured for Redis."})

    if infra_mode == "dedicated" and not dedicated_profile_id:
        blockers.append("Dedicated tenant onboarding requires a dedicated_profile_id.")
    if infra_mode == "shared" and dedicated_profile_id:
        blockers.append("Shared tenant onboarding must not include a dedicated_profile_id.")

    for requested_vertical in requested_verticals:
        if requested_vertical not in KNOWN_VERTICALS:
            blockers.append(f"Unknown vertical pack requested: {requested_vertical}.")
            continue

        if requested_vertical not in ONBOARDING_VERTICALS:
            blockers.append(
                f"Requested vertical pack is not approved for onboarding yet: {requested_vertical}."
            )

    if settings.env != "production":
        warnings.append(
            f"Environment is '{settings.env}'. Use production-grade infra and secrets before onboarding external businesses."
        )

    missing_website_settings = get_missing_website_automation_settings(settings)
    if missing_website_settings:
        detail = "Business website automation is not configured. Missing: " + ", ".join(missing_website_settings) + "."
        warnings.append(detail)
        checks.append({"key": "website_automation", "status": "warn", "detail": detail})
    else:
        checks.append(
            {
                "key": "website_automation",
                "status": "pass",
                "detail": "GitHub template repo automation and Vercel deployment automation are configured.",
            }
        )

    return {
        "ready": not blockers,
        "environment": settings.env,
        "supported_vertical_packs": sorted(ONBOARDING_VERTICALS),
        "planned_vertical_packs": sorted(KNOWN_VERTICALS - ONBOARDING_VERTICALS),
        "requested_vertical_packs": requested_verticals,
        "infra_mode": infra_mode,
        "blockers": blockers,
        "warnings": warnings,
        "checks": checks,
        "vertical_readiness": {
            vertical: VERTICAL_READINESS[vertical]
            for vertical in requested_verticals
            if vertical in VERTICAL_READINESS
        } or {
            vertical: VERTICAL_READINESS[vertical]
            for vertical in sorted(ONBOARDING_VERTICALS)
            if vertical in VERTICAL_READINESS
        },
    }


def assert_onboarding_ready(
    settings: Settings,
    *,
    vertical_pack: str,
    infra_mode: str,
    dedicated_profile_id: str | None,
) -> None:
    readiness = get_onboarding_readiness(
        settings,
        requested_vertical_pack=vertical_pack,
        infra_mode=infra_mode,
        dedicated_profile_id=dedicated_profile_id,
    )
    if not readiness["ready"]:
        raise ValidationError("Tenant onboarding blocked: " + " ".join(readiness["blockers"]))


def create_agency(
    db: Session,
    *,
    actor_user_id: str,
    slug: str,
    name: str,
    region: str,
    owner_user_id: str,
) -> dict[str, object]:
    if platform_repository.get_agency_by_slug(db, slug):
        raise ConflictError(f"Agency slug '{slug}' already exists.")

    agency = platform_repository.create_agency(
        db,
        slug=slug,
        name=name,
        region=region,
        owner_user_id=owner_user_id,
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=None,
        actor_user_id=actor_user_id,
        action="platform.agency.created",
        subject_type="agency",
        subject_id=str(agency.id),
        metadata_json={"slug": agency.slug},
    )
    db.commit()
    return serialize_agency(agency)


def list_all_agencies(db: Session) -> list[dict[str, object]]:
    return [serialize_agency(item) for item in platform_repository.list_agencies(db)]


def create_tenant(
    db: Session,
    settings: Settings,
    *,
    actor_user_id: str,
    agency_slug: str,
    slug: str,
    display_name: str,
    infra_mode: str,
    vertical_pack: str,
    business_type: str | None,
    admin_email: str | None,
    feature_flags: list[str],
    dedicated_profile_id: str | None,
) -> dict[str, object]:
    agency = platform_repository.get_agency_by_slug(db, agency_slug)
    if agency is None:
        raise NotFoundError(f"Agency '{agency_slug}' was not found.")

    if platform_repository.get_tenant_by_slug(db, slug):
        raise ConflictError(f"Tenant slug '{slug}' already exists.")

    assert_onboarding_ready(
        settings,
        vertical_pack=vertical_pack,
        infra_mode=infra_mode,
        dedicated_profile_id=dedicated_profile_id,
    )

    mongo_db_name = build_runtime_database_name(settings, tenant_slug=slug)

    tenant = platform_repository.create_tenant(
        db,
        agency_id=agency.id,
        slug=slug,
        display_name=display_name,
        infra_mode=infra_mode,
        vertical_pack=vertical_pack,
        business_type=business_type,
        feature_flags=feature_flags,
        dedicated_profile_id=dedicated_profile_id,
        mongo_db_name=mongo_db_name,
    )
    
    runtime_provisioning = provision_runtime_document_store_for_tenant(
        settings,
        tenant_slug=tenant.slug,
        vertical_pack=tenant.vertical_packs,
    )

    from app.services import publishing as publishing_service
 
    extra_metadata = {
        "admin_email": admin_email,
        "agency_slug": agency_slug,
        "business_type": business_type,
        "infra_mode": infra_mode,
        "db_name": mongo_db_name,
    }

 
    runtime_bootstrap = publishing_service.bootstrap_tenant_runtime_documents(
        get_runtime_document_store(settings),
        tenant,
        extra_metadata=extra_metadata,
    )

    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="platform.tenant.created",
        subject_type="tenant",
        subject_id=str(tenant.id),
        metadata_json={
            "slug": tenant.slug,
            "agency_slug": agency.slug,
            "runtime_database": runtime_provisioning["database"],
            "seeded_document_count": runtime_bootstrap["seeded_document_count"],
        },
    )
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant.id),
        aggregate_id=str(tenant.id),
        event_name="tenant.provisioned",
        payload_json={
            "tenant_slug": tenant.slug,
            "infra_mode": tenant.infra_mode,
            "vertical_packs": tenant.vertical_packs,
            "runtime_documents": {
                **runtime_provisioning,
                "bootstrap": runtime_bootstrap,
            },
        },
    )
    db.commit()
    website_deployment = provision_business_website(
        db,
        settings,
        tenant=tenant,
        actor_user_id=actor_user_id,
        admin_email=admin_email,
    )
    return serialize_tenant(
        tenant,
        settings=settings,
        bootstrap={
            **runtime_provisioning,
            **runtime_bootstrap,
        },
        website_deployment=website_deployment,
    )


def list_all_tenants(db: Session, settings: Settings) -> list[dict[str, object]]:
    return [_serialize_tenant_with_details(db, settings, item) for item in platform_repository.list_tenants(db)]


def get_onboarding_readiness_report(
    settings: Settings,
    *,
    requested_vertical_pack: str | None = None,
    requested_vertical_packs: list[str] | None = None,
    infra_mode: str | None = None,
    dedicated_profile_id: str | None = None,
) -> dict[str, object]:
    return get_onboarding_readiness(
        settings,
        requested_vertical_pack=requested_vertical_pack,
        requested_vertical_packs=requested_vertical_packs,
        infra_mode=infra_mode,
        dedicated_profile_id=dedicated_profile_id,
    )


def get_tenant_or_raise(db: Session, *, tenant_slug: str):
    tenant = platform_repository.get_tenant_by_slug(db, tenant_slug)
    if tenant is None:
        tenant = platform_repository.get_tenant_by_id(db, tenant_slug)
    if tenant is None:
        raise NotFoundError(f"Tenant '{tenant_slug}' was not found.")
    return tenant


def get_registry_snapshot(db: Session, *, tenant_slug: str) -> dict[str, object]:
    tenant = get_tenant_or_raise(db, tenant_slug=tenant_slug)

    modules = list(BASE_MODULES)
    if tenant.vertical_packs and tenant.vertical_packs in VERTICAL_MODULES:
        modules.extend(VERTICAL_MODULES[tenant.vertical_packs])

    features = list(BASE_FEATURES)
    features.extend(tenant.feature_flags)
    if tenant.infra_mode == "dedicated":
        features.append("dedicated-infra-profile")

    return {
        "tenant_id": tenant.slug,
        "tenant_record_id": str(tenant.id),
        "agency_id": str(tenant.agency_id),
        "modules": sorted(set(modules)),
        "features": sorted(set(features)),
        "generated_at": tenant.created_at.isoformat(),
    }


def get_current_tenant_summary(db: Session, settings: Settings, *, tenant_slug: str) -> dict[str, object]:
    tenant = get_tenant_or_raise(db, tenant_slug=tenant_slug)
    return _serialize_tenant_with_details(db, settings, tenant)


def list_audit_events_for_scope(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant_id = None if tenant_slug == "platform_control" else get_tenant_or_raise(db, tenant_slug=tenant_slug).id
    return [serialize_audit_event(item) for item in platform_repository.list_audit_events(db, tenant_id=tenant_id)]


def list_outbox_events_for_scope(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant_id = None if tenant_slug == "platform_control" else get_tenant_or_raise(db, tenant_slug=tenant_slug).id
    return [serialize_outbox_event(item) for item in platform_repository.list_outbox_events(db, tenant_id=tenant_id)]


def _serialize_tenant_with_details(
    db: Session,
    settings: Settings,
    tenant,
    *,
    bootstrap: dict[str, object] | None = None,
) -> dict[str, object]:
    website_deployment = platform_repository.get_tenant_website_deployment(db, tenant_id=str(tenant.id))
    return serialize_tenant(
        tenant,
        settings=settings,
        bootstrap=bootstrap,
        website_deployment=website_deployment,
    )


def get_business_blueprint(
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str | None = None,
    database_name: str | None = None,
) -> dict[str, object]:
    if tenant_slug:
        doc = store.get_document(
            collection="business_blueprints",
            tenant_slug=tenant_slug,
            document_key="blueprint",
            database_name=database_name,
        )
    else:
        # Fallback to direct mongo query if slug is not known but DB is
        db = get_runtime_mongo_database(get_settings(), database_name=database_name)
        doc = db["business_blueprints"].find_one({"document_key": "blueprint"})

    if doc is None:
        raise NotFoundError(f"Blueprint not found in database '{database_name}'")

    return serialize_mongo(doc)


def put_business_blueprint(
    store: RuntimeDocumentStore,
    *,
    payload: BusinessBlueprintPayloadRequest,
    tenant_slug: str,
    database_name: str | None = None,
) -> dict[str, Any]:
    db = get_runtime_mongo_database(get_settings(), database_name=database_name)
    result = db["business_blueprints"].find_one_and_update(
        {"document_key": "blueprint"},
        {"$set": {
            "payload": payload.model_dump(),
            "updatedAt": datetime.now(tz=UTC)
        }},
        return_document=ReturnDocument.AFTER
    )
    return serialize_mongo(result)
