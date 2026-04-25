from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.authz import require_permission
from app.core.config import Settings, get_settings
from app.core.security import SessionContext
from app.db.mongo import RuntimeDocumentStore, get_runtime_document_store
from app.db.session import get_db_session
from app.schemas.requests import (
    CreateAgencyRequest,
    CreateTenantRequest,
    BusinessBlueprintPayloadRequest,
)
from app.services.errors import ConflictError, NotFoundError, ValidationError
from app.services.infrastructure import get_storage_topology
from app.services.platform import (
    create_agency,
    create_tenant,
    get_business_blueprint,
    get_current_tenant_summary,
    get_onboarding_readiness_report,
    get_registry_snapshot,
    list_all_agencies,
    list_all_tenants,
    list_audit_events_for_scope,
    list_outbox_events_for_scope,
    put_business_blueprint,
    sync_tenant_website_domains,
)

router = APIRouter()


def _resolve_scope_tenant_slug(session: SessionContext, requested_tenant_slug: str | None) -> str:
    if requested_tenant_slug is None or requested_tenant_slug == session.tenant_id:
        return session.tenant_id

    if session.role == "platform_admin":
        return requested_tenant_slug

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied for requested tenant scope.")


@router.get("/registry")
def registry(
    session: SessionContext = Depends(require_permission("platform.registry.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return get_registry_snapshot(db, tenant_slug=session.tenant_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/tenant")
def current_tenant(
    session: SessionContext = Depends(require_permission("platform.registry.read")),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    try:
        return get_current_tenant_summary(db, settings, tenant_slug=session.tenant_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

        


@router.get("/agencies")
def agencies(
    _: SessionContext = Depends(require_permission("platform.agencies.manage")),
    db: Session = Depends(get_db_session),
):
    return {"agencies": list_all_agencies(db)}


@router.post("/agencies", status_code=status.HTTP_201_CREATED)
def agencies_create(
    payload: CreateAgencyRequest,
    session: SessionContext = Depends(require_permission("platform.agencies.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return create_agency(
            db,
            actor_user_id=session.user_id,
            slug=payload.slug,
            name=payload.name,
            region=payload.region,
            owner_user_id=payload.owner_user_id,
        )
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("/tenants")
def tenants(
    _: SessionContext = Depends(require_permission("platform.tenants.manage")),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    return {"tenants": list_all_tenants(db, settings)}


@router.post("/tenants", status_code=status.HTTP_201_CREATED)
def tenants_create(
    payload: CreateTenantRequest,
    session: SessionContext = Depends(require_permission("platform.tenants.manage")),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    try:
        return create_tenant(
            db,
            settings,
            actor_user_id=session.user_id,
            agency_slug=payload.agency_slug,
            slug=payload.slug,
            display_name=payload.display_name,
            infra_mode=payload.infra_mode,
            vertical_pack=payload.vertical_pack,
            business_type=payload.business_type,
            admin_email=payload.admin_email,
            primary_domains=payload.primary_domains,
            feature_flags=payload.feature_flags,
            dedicated_profile_id=payload.dedicated_profile_id,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/tenants/{tenant_slug}/website/sync")
def tenant_website_sync(
    tenant_slug: str,
    session: SessionContext = Depends(require_permission("platform.tenants.manage")),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    try:
        return sync_tenant_website_domains(
            db,
            settings,
            actor_user_id=session.user_id,
            tenant_slug=tenant_slug,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/audit")
def audit_log(
    tenant_slug: str | None = None,
    session: SessionContext = Depends(require_permission("platform.audit.read")),
    db: Session = Depends(get_db_session),
):
    scope_tenant_slug = _resolve_scope_tenant_slug(session, tenant_slug)
    try:
        return {"tenant_id": scope_tenant_slug, "events": list_audit_events_for_scope(db, tenant_slug=scope_tenant_slug)}
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/outbox")
def outbox(
    tenant_slug: str | None = None,
    session: SessionContext = Depends(require_permission("platform.outbox.read")),
    db: Session = Depends(get_db_session),
):
    scope_tenant_slug = _resolve_scope_tenant_slug(session, tenant_slug)
    try:
        return {"tenant_id": scope_tenant_slug, "events": list_outbox_events_for_scope(db, tenant_slug=scope_tenant_slug)}
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/storage-topology")
def storage_topology(
    _: SessionContext = Depends(require_permission("platform.registry.read")),
    settings: Settings = Depends(get_settings),
):
    return get_storage_topology(settings)


@router.get("/onboarding-readiness")
def onboarding_readiness(
    requested_vertical_packs: list[str] = Query(default_factory=list),
    requested_vertical_pack: str | None = Query(default=None),
    infra_mode: str | None = None,
    dedicated_profile_id: str | None = None,
    _: SessionContext = Depends(require_permission("platform.tenants.manage")),
    settings: Settings = Depends(get_settings),
):
    return get_onboarding_readiness_report(
        settings,
        requested_vertical_pack=requested_vertical_pack,
        requested_vertical_packs=requested_vertical_packs,
        infra_mode=infra_mode,
        dedicated_profile_id=dedicated_profile_id,
    )


@router.get("/business-blueprint")
def business_blueprint_get(
    session: SessionContext = Depends(require_permission("publishing.blueprints.read")),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        business_blueprint = get_business_blueprint(
            store,
            tenant_slug=session.tenant_id,
            database_name=session.tenant_db_name,
        )
        return {
            "message": "Business blueprint retrieved successfully",
            "success": True,
            "data": business_blueprint,
        }
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.put("/business-blueprint")
def business_blueprint_put(
    payload: BusinessBlueprintPayloadRequest,
    session: SessionContext = Depends(require_permission("publishing.blueprints.manage")),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        
        result = put_business_blueprint(
            store,
            tenant_slug=session.tenant_id,
            database_name=session.tenant_db_name,
            payload=payload
        )

        return {
            "message": "Business blueprint updated successfully",
            "success": True,
            "data": result,
        }
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
