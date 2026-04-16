from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ImportJobModel, ImportSourceModel


async def list_import_sources(db: Session, *, tenant_id: str) -> list[ImportSourceModel]:
    query = select(ImportSourceModel).where(ImportSourceModel.tenant_id == tenant_id)
    query = query.order_by(ImportSourceModel.created_at.desc())
    return list(db.scalars(query))


async def get_import_source(db: Session, *, source_id: str, tenant_id: str) -> ImportSourceModel | None:
    query = select(ImportSourceModel).where(
        ImportSourceModel.id == source_id,
        ImportSourceModel.tenant_id == tenant_id,
    )
    return db.scalar(query)


async def create_import_source(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    source_type: str,
    connection_profile_key: str,
    vertical_pack: str,
    config_json: dict[str, object],
) -> ImportSourceModel:
    source = ImportSourceModel(
        tenant_id=tenant_id,
        name=name,
        source_type=source_type,
        connection_profile_key=connection_profile_key,
        vertical_pack=vertical_pack,
        config_json=config_json,
    )
    db.add(source)
    db.flush()
    return source


async def list_import_jobs(db: Session, *, tenant_id: str) -> list[ImportJobModel]:
    query = select(ImportJobModel).where(ImportJobModel.tenant_id == tenant_id)
    query = query.order_by(ImportJobModel.created_at.desc())
    return list(db.scalars(query))


async def create_import_job(
    db: Session,
    *,
    tenant_id: str,
    source_id: str,
    requested_by_user_id: str,
    mode: str,
    status: str,
    report_json: dict[str, object],
) -> ImportJobModel:
    job = ImportJobModel(
        tenant_id=tenant_id,
        source_id=source_id,
        requested_by_user_id=requested_by_user_id,
        mode=mode,
        status=status,
        report_json=report_json,
    )
    db.add(job)
    db.flush()
    return job
