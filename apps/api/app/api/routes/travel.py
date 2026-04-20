from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.authz import require_permission
from app.core.security import SessionContext
from app.db.session import get_db_session
from app.schemas.requests import (
    CreateTravelDepartureRequest,
    CreateTravelLeadRequest,
    CreateTravelPackageRequest,
    TravelDepartureStatusRequest,
    TravelLeadStatusRequest,
)
from app.services.errors import ConflictError, NotFoundError
from app.services.travel import (
    create_departure,
    create_lead,
    create_package,
    get_overview,
    list_departures,
    list_leads,
    list_packages,
    load_legacy_travel_plan,
    update_departure_status,
    update_lead_status,
)

router = APIRouter()


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, NotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, ConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    raise exc


@router.get("/overview")
async def travel_overview(
    session: SessionContext = Depends(require_permission("travel.packages.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_overview(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name)
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/packages")
async def travel_packages(
    session: SessionContext = Depends(require_permission("travel.packages.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "packages": await list_packages(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/packages", status_code=status.HTTP_201_CREATED)
async def travel_packages_create(
    payload: CreateTravelPackageRequest,
    session: SessionContext = Depends(require_permission("travel.packages.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_package(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            code=payload.code,
            slug=payload.slug,
            title=payload.title,
            summary=payload.summary,
            origin_city=payload.origin_city,
            destination_city=payload.destination_city,
            destination_country=payload.destination_country,
            duration_days=payload.duration_days,
            base_price_minor=payload.base_price_minor,
            currency=payload.currency,
            status=payload.status,
            itinerary_days=[item.model_dump() for item in payload.itinerary_days],
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/departures")
async def travel_departures(
    package_id: str | None = None,
    departure_status: str | None = None,
    session: SessionContext = Depends(require_permission("travel.packages.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "departures": await list_departures(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                package_id=package_id,
                status=departure_status,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/departures", status_code=status.HTTP_201_CREATED)
async def travel_departures_create(
    payload: CreateTravelDepartureRequest,
    session: SessionContext = Depends(require_permission("travel.packages.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_departure(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            package_id=payload.package_id,
            departure_date=payload.departure_date,
            return_date=payload.return_date,
            seats_total=payload.seats_total,
            seats_available=payload.seats_available,
            price_override_minor=payload.price_override_minor,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/departures/{departure_id}/status")
async def travel_departures_update_status(
    departure_id: str,
    payload: TravelDepartureStatusRequest,
    session: SessionContext = Depends(require_permission("travel.packages.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_departure_status(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            departure_id=departure_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/leads")
async def travel_leads(
    lead_status: str | None = None,
    interested_package_id: str | None = None,
    session: SessionContext = Depends(require_permission("travel.leads.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "leads": await list_leads(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                status=lead_status,
                interested_package_id=interested_package_id,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/leads", status_code=status.HTTP_201_CREATED)
async def travel_leads_create(
    payload: CreateTravelLeadRequest,
    session: SessionContext = Depends(require_permission("travel.leads.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_lead(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            source=payload.source,
            interested_package_id=payload.interested_package_id,
            departure_id=payload.departure_id,
            customer_id=payload.customer_id,
            contact_name=payload.contact_name,
            contact_phone=payload.contact_phone,
            travelers_count=payload.travelers_count,
            desired_departure_date=payload.desired_departure_date,
            budget_minor=payload.budget_minor,
            currency=payload.currency,
            status=payload.status,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/leads/{lead_id}/status")
async def travel_leads_update_status(
    lead_id: str,
    payload: TravelLeadStatusRequest,
    session: SessionContext = Depends(require_permission("travel.leads.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_lead_status(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            lead_id=lead_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/legacy-plan")
async def travel_legacy_plan(
    _: SessionContext = Depends(require_permission("imports.sources.read")),
):
    return load_legacy_travel_plan()


router.add_api_route("/overview", travel_overview, methods=["GET"])
router.add_api_route("/packages", travel_packages, methods=["GET"])
router.add_api_route("/packages", travel_packages_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
router.add_api_route("/departures", travel_departures, methods=["GET"])
router.add_api_route("/departures", travel_departures_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
router.add_api_route("/departures/{departure_id}/status", travel_departures_update_status, methods=["PATCH"])
router.add_api_route("/leads", travel_leads, methods=["GET"])
router.add_api_route("/leads", travel_leads_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
router.add_api_route("/leads/{lead_id}/status", travel_leads_update_status, methods=["PATCH"])
router.add_api_route("/legacy/plan", travel_legacy_plan, methods=["GET"])
