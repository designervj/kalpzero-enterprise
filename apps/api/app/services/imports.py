from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.repositories import imports as import_repository
from app.repositories import platform as platform_repository
from app.services.errors import NotFoundError
from app.services.imports_commerce import run_commerce_import_job
from app.services.platform import serialize_audit_event, serialize_outbox_event


def serialize_import_source(source) -> dict[str, object]:
    return {
        "id": str(source.id),
        "tenant_id": str(source.tenant_id),
        "name": source.name,
        "source_type": source.source_type,
        "connection_profile_key": source.connection_profile_key,
        "vertical_pack": source.vertical_pack,
        "config": source.config_json,
        "created_at": source.created_at.isoformat(),
    }


def serialize_import_job(job) -> dict[str, object]:
    return {
        "id": str(job.id),
        "tenant_id": str(job.tenant_id),
        "source_id": str(job.source_id),
        "requested_by_user_id": str(job.requested_by_user_id),
        "mode": job.mode,
        "status": job.status,
        "report": job.report_json,
        "created_at": job.created_at.isoformat(),
        "finished_at": job.finished_at,
    }


async def create_import_source(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    source_type: str,
    connection_profile_key: str,
    vertical_pack: str,
    config_json: dict[str, object],
) -> dict[str, object]:
    tenant = platform_repository.get_tenant_by_slug(db, tenant_slug)
    if tenant is None:
        raise NotFoundError(f"Tenant '{tenant_slug}' was not found.")

    source = await import_repository.create_import_source(
        db,
        tenant_id=tenant.id,
        name=name,
        source_type=source_type,
        connection_profile_key=connection_profile_key,
        vertical_pack=vertical_pack,
        config_json=config_json,
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="imports.source.created",
        subject_type="import_source",
        subject_id=str(source.id),
        metadata_json={"source_type": source.source_type, "vertical_pack": source.vertical_pack},
    )
    db.commit()
    return serialize_import_source(source)


async def list_import_sources(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = platform_repository.get_tenant_by_slug(db, tenant_slug)
    if tenant is None:
        raise NotFoundError(f"Tenant '{tenant_slug}' was not found.")

    sources = await import_repository.list_import_sources(db, tenant_id=tenant.id)
    return [serialize_import_source(item) for item in sources]


async def create_import_job(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    source_id: str,
    mode: str,
) -> dict[str, object]:
    tenant = platform_repository.get_tenant_by_slug(db, tenant_slug)
    if tenant is None:
        raise NotFoundError(f"Tenant '{tenant_slug}' was not found.")

    source = await import_repository.get_import_source(db, source_id=source_id, tenant_id=tenant.id)
    if source is None:
        raise NotFoundError(f"Import source '{source_id}' was not found.")

    report_json = {
        "stage": "queued",
        "summary": "Job accepted for canonical validation and processing.",
        "supports_dry_run": True,
    }
    job = await import_repository.create_import_job(
        db,
        tenant_id=tenant.id,
        source_id=source.id,
        requested_by_user_id=actor_user_id,
        mode=mode,
        status="processing",
        report_json=report_json,
    )
    audit_event = platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="imports.job.created",
        subject_type="import_job",
        subject_id=str(job.id),
        metadata_json={"source_id": str(source.id), "mode": mode},
    )
    outbox_event = platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant.id),
        aggregate_id=str(job.id),
        event_name="import.job.queued",
        payload_json={
            "tenant_slug": tenant.slug,
            "source_id": str(source.id),
            "mode": mode,
            "source_type": source.source_type,
        },
    )
    result_audit_event = None
    result_outbox_event = None

    if source.vertical_pack == "commerce":
        try:
            result_status, result_report = await run_commerce_import_job(
                db,
                tenant_id=str(tenant.id),
                source=source,
                actor_user_id=actor_user_id,
                job_id=str(job.id),
                mode=mode,
            )
        except Exception as exc:
            result_status = "failed"
            result_report = {
                "stage": "validation_failed",
                "summary": f"Commerce import failed before execution: {exc}",
                "supports_dry_run": True,
                "vertical_pack": "commerce",
                "mode": mode,
                "dry_run": mode == "dry_run",
                "executed": False,
                "warnings": [],
                "errors": [str(exc)],
                "entities": {},
                "totals": {
                    "source_records": 0,
                    "create_candidates": 0,
                    "created": 0,
                    "skipped_existing": 0,
                    "errors": 1,
                },
            }
        job.status = result_status
        job.report_json = result_report
        job.finished_at = datetime.now(tz=UTC).isoformat()
        result_audit_event = platform_repository.create_audit_event(
            db,
            tenant_id=str(tenant.id),
            actor_user_id=actor_user_id,
            action=f"imports.job.{result_status}",
            subject_type="import_job",
            subject_id=str(job.id),
            metadata_json={
                "source_id": str(source.id),
                "mode": mode,
                "vertical_pack": source.vertical_pack,
                "error_count": result_report["totals"]["errors"],
                "created_count": result_report["totals"]["created"],
            },
        )
        result_outbox_event = platform_repository.enqueue_outbox_event(
            db,
            tenant_id=str(tenant.id),
            aggregate_id=str(job.id),
            event_name=f"import.job.{result_status}",
            payload_json={
                "tenant_slug": tenant.slug,
                "source_id": str(source.id),
                "job_id": str(job.id),
                "mode": mode,
                "vertical_pack": source.vertical_pack,
                "summary": result_report["summary"],
            },
        )
    else:
        job.status = "queued"

    db.commit()
    response = {
        "job": serialize_import_job(job),
        "audit_event": serialize_audit_event(audit_event),
        "outbox_event": serialize_outbox_event(outbox_event),
    }
    if result_audit_event is not None:
        response["result_audit_event"] = serialize_audit_event(result_audit_event)
    if result_outbox_event is not None:
        response["result_outbox_event"] = serialize_outbox_event(result_outbox_event)
    return response


async def list_import_jobs(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = platform_repository.get_tenant_by_slug(db, tenant_slug)
    if tenant is None:
        raise NotFoundError(f"Tenant '{tenant_slug}' was not found.")

    jobs = await import_repository.list_import_jobs(db, tenant_id=tenant.id)
    return [serialize_import_job(item) for item in jobs]
