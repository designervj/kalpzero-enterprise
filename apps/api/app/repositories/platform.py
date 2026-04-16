from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AgencyModel, AuditEventModel, OutboxEventModel, TenantModel


def list_agencies(db: Session) -> list[AgencyModel]:
    return list(db.scalars(select(AgencyModel).order_by(AgencyModel.created_at.desc())))


def get_agency_by_slug(db: Session, slug: str) -> AgencyModel | None:
    return db.scalar(select(AgencyModel).where(AgencyModel.slug == slug))


def create_agency(
    db: Session,
    *,
    slug: str,
    name: str,
    region: str,
    owner_user_id: str,
) -> AgencyModel:
    agency = AgencyModel(slug=slug, name=name, region=region, owner_user_id=owner_user_id)
    db.add(agency)
    db.flush()
    return agency


def list_tenants(db: Session) -> list[TenantModel]:
    return list(db.scalars(select(TenantModel).order_by(TenantModel.created_at.desc())))


def get_tenant_by_slug(db: Session, slug: str) -> TenantModel | None:
    return db.scalar(select(TenantModel).where(TenantModel.slug == slug))


def get_tenant_by_id(db: Session, id: str) -> TenantModel | None:
    return db.scalar(select(TenantModel).where(TenantModel.id == id))

def create_tenant(
    db: Session,
    *,
    agency_id: str,
    slug: str,
    display_name: str,
    infra_mode: str,
    vertical_pack: str,
    business_type: str | None,
    feature_flags: list[str],
    dedicated_profile_id: str | None,
    mongo_db_name: str | None,
) -> TenantModel:
    # Keep the stored value list-shaped so existing publishing/bootstrap helpers
    # can continue to read tenant.vertical_packs without a broader refactor.
    tenant = TenantModel(
        agency_id=agency_id,
        slug=slug,
        display_name=display_name,
        infra_mode=infra_mode,
        vertical_packs=[vertical_pack],
        business_type=business_type,
        feature_flags=feature_flags,
        dedicated_profile_id=dedicated_profile_id,
        mongo_db_name=mongo_db_name,
    )
    db.add(tenant)
    db.flush()
    return tenant


def create_audit_event(
    db: Session,
    *,
    tenant_id: str | None,
    actor_user_id: str,
    action: str,
    subject_type: str,
    subject_id: str,
    metadata_json: dict[str, object] | None = None,
) -> AuditEventModel:
    event = AuditEventModel(
        tenant_id=tenant_id,
        actor_user_id=actor_user_id,
        action=action,
        subject_type=subject_type,
        subject_id=subject_id,
        metadata_json=metadata_json or {},
    )
    db.add(event)
    db.flush()
    return event


def list_audit_events(db: Session, *, tenant_id: str | None) -> list[AuditEventModel]:
    query = select(AuditEventModel).order_by(AuditEventModel.created_at.desc())
    if tenant_id is None:
        query = query.where(AuditEventModel.tenant_id.is_(None))
    else:
        query = query.where(AuditEventModel.tenant_id == tenant_id)
    return list(db.scalars(query.limit(50)))


def enqueue_outbox_event(
    db: Session,
    *,
    tenant_id: str | None,
    aggregate_id: str,
    event_name: str,
    payload_json: dict[str, object],
) -> OutboxEventModel:
    event = OutboxEventModel(
        tenant_id=tenant_id,
        aggregate_id=aggregate_id,
        event_name=event_name,
        payload_json=payload_json,
    )
    db.add(event)
    db.flush()
    return event


def list_outbox_events(db: Session, *, tenant_id: str | None) -> list[OutboxEventModel]:
    query = select(OutboxEventModel).order_by(OutboxEventModel.created_at.desc())
    if tenant_id is None:
        query = query.where(OutboxEventModel.tenant_id.is_(None))
    else:
        query = query.where(OutboxEventModel.tenant_id == tenant_id)
    return list(db.scalars(query.limit(50)))
