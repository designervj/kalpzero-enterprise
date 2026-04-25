from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    AgencyModel,
    AuditEventModel,
    OutboxEventModel,
    TenantModel,
    TenantWebsiteDomainModel,
    TenantWebsiteDeploymentModel,
)


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


def get_tenant_website_deployment(db: Session, *, tenant_id: str) -> TenantWebsiteDeploymentModel | None:
    return db.scalar(select(TenantWebsiteDeploymentModel).where(TenantWebsiteDeploymentModel.tenant_id == tenant_id))


def get_or_create_tenant_website_deployment(
    db: Session,
    *,
    tenant_id: str,
    provider: str = "github_vercel",
) -> TenantWebsiteDeploymentModel:
    deployment = get_tenant_website_deployment(db, tenant_id=tenant_id)
    if deployment is not None:
        return deployment

    deployment = TenantWebsiteDeploymentModel(tenant_id=tenant_id, provider=provider)
    db.add(deployment)
    db.flush()
    return deployment


def list_tenant_website_domains(db: Session, *, tenant_id: str) -> list[TenantWebsiteDomainModel]:
    query = (
        select(TenantWebsiteDomainModel)
        .where(TenantWebsiteDomainModel.tenant_id == tenant_id)
        .order_by(TenantWebsiteDomainModel.is_primary.desc(), TenantWebsiteDomainModel.created_at.asc())
    )
    return list(db.scalars(query))


def get_tenant_website_domain_by_host(db: Session, *, host: str) -> TenantWebsiteDomainModel | None:
    return db.scalar(select(TenantWebsiteDomainModel).where(TenantWebsiteDomainModel.host == host))


def update_tenant_website_domain(
    db: Session,
    domain: TenantWebsiteDomainModel,
    **fields,
) -> TenantWebsiteDomainModel:
    for key, value in fields.items():
        setattr(domain, key, value)

    db.add(domain)
    db.flush()
    return domain


def upsert_tenant_website_domain(
    db: Session,
    *,
    tenant_id: str,
    host: str,
    domain_kind: str,
    ssl_status: str = "pending",
    is_primary: bool = False,
    active: bool = True,
    metadata_json: dict[str, object] | None = None,
) -> TenantWebsiteDomainModel:
    domain = get_tenant_website_domain_by_host(db, host=host)
    if domain is None:
        domain = TenantWebsiteDomainModel(
            tenant_id=tenant_id,
            host=host,
            domain_kind=domain_kind,
            ssl_status=ssl_status,
            is_primary=is_primary,
            active=active,
            metadata_json=metadata_json or {},
        )
    else:
        domain.tenant_id = tenant_id
        domain.domain_kind = domain_kind
        domain.ssl_status = ssl_status
        domain.is_primary = is_primary
        domain.active = active
        domain.metadata_json = metadata_json or {}

    db.add(domain)
    db.flush()
    return domain


def update_tenant_website_deployment(
    db: Session,
    deployment: TenantWebsiteDeploymentModel,
    **fields,
) -> TenantWebsiteDeploymentModel:
    for key, value in fields.items():
        setattr(deployment, key, value)

    db.add(deployment)
    db.flush()
    return deployment


def create_tenant(
    db: Session,
    *,
    agency_id: str,
    slug: str,
    display_name: str,
    infra_mode: str,
    vertical_pack: str,
    business_type: str | None = None,
    feature_flags: list[str],
    dedicated_profile_id: str | None,
    mongo_db_name: str | None = None,
) -> TenantModel:
    tenant = TenantModel(
        agency_id=agency_id,
        slug=slug,
        display_name=display_name,
        infra_mode=infra_mode,
        vertical_packs=vertical_pack,
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
