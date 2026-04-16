from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.authz import require_permission
from app.core.security import SessionContext
from app.db.session import get_db_session
from app.schemas.requests import CreateImportJobRequest, CreateImportSourceRequest
from app.services.commerce import load_legacy_commerce_plan
from app.services.errors import NotFoundError
from app.services.hotel import load_external_hotel_plan
from app.services.imports import create_import_job, create_import_source, list_import_jobs, list_import_sources
from app.services.travel import load_legacy_travel_plan

router = APIRouter()


@router.get("/sources")
async def import_sources(
    session: SessionContext = Depends(require_permission("imports.sources.read")),
    db: Session = Depends(get_db_session),
):
    try:
        sources = await list_import_sources(db, tenant_slug=session.tenant_id)
        return {"tenant_id": ctx.tenant_id, "sources": sources}
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/sources", status_code=status.HTTP_201_CREATED)
async def import_sources_create(
    payload: CreateImportSourceRequest,
    session: SessionContext = Depends(require_permission("imports.sources.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_import_source(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            source_type=payload.source_type,
            connection_profile_key=payload.connection_profile_key,
            vertical_pack=payload.vertical_pack,
            config_json=payload.config,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/jobs")
async def import_jobs(
    session: SessionContext = Depends(require_permission("imports.jobs.read")),
    db: Session = Depends(get_db_session),
):
    try:
        jobs = await list_import_jobs(db, tenant_slug=session.tenant_id)
        return {"tenant_id": ctx.tenant_id, "jobs": jobs}
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def import_jobs_create(
    payload: CreateImportJobRequest,
    session: SessionContext = Depends(require_permission("imports.jobs.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_import_job(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            source_id=payload.source_id,
            mode=payload.mode,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/legacy/commerce-plan")
def legacy_commerce_plan(
    _: SessionContext = Depends(require_permission("imports.sources.read")),
):
    return load_legacy_commerce_plan()


@router.get("/legacy/travel-plan")
def legacy_travel_plan(
    _: SessionContext = Depends(require_permission("imports.sources.read")),
):
    return load_legacy_travel_plan()


@router.get("/external/hotel-plan")
def external_hotel_plan(
    _: SessionContext = Depends(require_permission("imports.sources.read")),
):
    return load_external_hotel_plan()
