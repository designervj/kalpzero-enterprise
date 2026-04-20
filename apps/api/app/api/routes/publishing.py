from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.authz import require_permission
from app.core.security import SessionContext
from app.db.mongo import RuntimeDocumentStore, get_runtime_document_store
from app.db.session import get_db_session
from app.schemas.requests import (
    UpdateBusinessBlueprintRequest,
    UpsertDiscoveryDocumentRequest,
    UpsertPublishingPageRequest,
)
from app.services.errors import NotFoundError
from app.services.publishing import (
    get_blueprint,
    get_discovery,
    get_page,
    get_public_site_payload,
    get_publishing_overview,
    list_pages,
    update_blueprint,
    upsert_discovery,
    upsert_page,
)

router = APIRouter()


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, NotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    raise exc


@router.get("/overview")
def publishing_overview(
    session: SessionContext = Depends(require_permission("publishing.pages.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return get_publishing_overview(db, store, tenant_slug=session.tenant_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/blueprint")
def publishing_blueprint(
    session: SessionContext = Depends(require_permission("publishing.blueprints.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return get_blueprint(db, store, tenant_slug=session.tenant_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.put("/blueprint")
def publishing_blueprint_update(
    payload: UpdateBusinessBlueprintRequest,
    session: SessionContext = Depends(require_permission("publishing.blueprints.manage")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return update_blueprint(
            db,
            store,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            payload={
                "business_label": payload.business_label,
                "public_theme": payload.public_theme.model_dump(),
                "admin_theme": payload.admin_theme.model_dump(),
                "public_navigation": [item.model_dump() for item in payload.public_navigation],
                "admin_navigation": [item.model_dump() for item in payload.admin_navigation],
                "routes": [item.model_dump() for item in payload.routes],
                "dashboard_widgets": [item.model_dump() for item in payload.dashboard_widgets],
                "vocabulary": payload.vocabulary,
                "enabled_modules": payload.enabled_modules,
                "mobile_capabilities": payload.mobile_capabilities,
            },
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/pages")
def publishing_pages(
    session: SessionContext = Depends(require_permission("publishing.pages.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return {"tenant_id": session.tenant_id, "pages": list_pages(db, store, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/pages/{page_slug}")
def publishing_page(
    page_slug: str,
    session: SessionContext = Depends(require_permission("publishing.pages.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return get_page(db, store, tenant_slug=session.tenant_id, page_slug=page_slug)
    except Exception as exc:
        _raise_http_error(exc)


@router.put("/pages/{page_slug}")
def publishing_page_upsert(
    page_slug: str,
    payload: UpsertPublishingPageRequest,
    session: SessionContext = Depends(require_permission("publishing.pages.manage")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return upsert_page(
            db,
            store,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            page_slug=page_slug,
            payload={
                "title": payload.title,
                "status": payload.status,
                "seo_title": payload.seo_title,
                "seo_description": payload.seo_description,
                "route_path": payload.route_path,
                "layout": payload.layout,
                "blocks": [item.model_dump() for item in payload.blocks],
            },
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/discovery")
def publishing_discovery(
    session: SessionContext = Depends(require_permission("publishing.discovery.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return get_discovery(db, store, tenant_slug=session.tenant_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.put("/discovery")
def publishing_discovery_upsert(
    payload: UpsertDiscoveryDocumentRequest,
    session: SessionContext = Depends(require_permission("publishing.discovery.manage")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return upsert_discovery(
            db,
            store,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            payload={
                "headline": payload.headline,
                "summary": payload.summary,
                "tags": payload.tags,
                "cards": [item.model_dump() for item in payload.cards],
            },
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/public/{tenant_slug}/site")
def publishing_public_site(
    tenant_slug: str,
    page_slug: str = "home",
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return get_public_site_payload(db, store, tenant_slug=tenant_slug, page_slug=page_slug)
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/public/{tenant_slug}/blueprint-preview")
def publishing_public_blueprint_preview(
    tenant_slug: str,
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        blueprint = get_blueprint(db, store, tenant_slug=tenant_slug)
        return {
            "tenant_slug": blueprint["tenant_slug"],
            "tenant_id": blueprint["tenant_id"],
            "version": blueprint["version"],
            "business_label": blueprint["business_label"],
            "vertical_packs": blueprint["vertical_packs"],
            "enabled_modules": blueprint["enabled_modules"],
            "public_theme": blueprint["public_theme"],
            "admin_theme": blueprint["admin_theme"],
            "public_navigation": blueprint["public_navigation"],
            "admin_navigation": blueprint["admin_navigation"],
            "routes": blueprint["routes"],
            "dashboard_widgets": blueprint["dashboard_widgets"],
            "vocabulary": blueprint["vocabulary"],
            "mobile_capabilities": blueprint["mobile_capabilities"],
        }
    except Exception as exc:
        _raise_http_error(exc)
