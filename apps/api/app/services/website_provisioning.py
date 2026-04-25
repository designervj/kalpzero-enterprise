import json
import logging
import re
import socket
import subprocess
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.repositories import platform as platform_repository

GITHUB_API_BASE = "https://api.github.com"
VERCEL_API_BASE = "https://api.vercel.com"
GITHUB_API_VERSION = "2022-11-28"
USER_AGENT = "kalpzero-enterprise/0.1"
PENDING_DEPLOYMENT_STATUSES = {"QUEUED", "BUILDING", "INITIALIZING"}
DEPLOYMENT_POLL_ATTEMPTS = 6
DEPLOYMENT_POLL_INTERVAL_SECONDS = 5
DOMAIN_PROVISION_TIMEOUT_SECONDS = 180

logger = logging.getLogger(__name__)


class WebsiteProvisioningError(RuntimeError):
    pass


def _sanitize_identifier(value: str, *, max_length: int) -> str:
    normalized = re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")
    collapsed = re.sub(r"-{2,}", "-", normalized)
    if not collapsed:
        collapsed = "business-site"
    return collapsed[:max_length].rstrip("-") or "business-site"


def build_repository_name(settings: Settings, *, tenant_slug: str) -> str:
    prefix = _sanitize_identifier(settings.github_repo_prefix or "kalp-biz", max_length=32)
    slug = _sanitize_identifier(tenant_slug, max_length=55)
    return _sanitize_identifier(f"{prefix}-{slug}", max_length=90)


def build_project_name(settings: Settings, *, tenant_slug: str) -> str:
    prefix = _sanitize_identifier(settings.vercel_project_prefix or "kalp-biz", max_length=32)
    slug = _sanitize_identifier(tenant_slug, max_length=55)
    return _sanitize_identifier(f"{prefix}-{slug}", max_length=100)


def get_missing_website_automation_settings(settings: Settings) -> list[str]:
    required_settings: dict[str, object | None] = {
        "KALPZERO_GITHUB_TOKEN": settings.github_token,
        "KALPZERO_GITHUB_REPO_OWNER": settings.github_repo_owner,
        "KALPZERO_GITHUB_TEMPLATE_OWNER": settings.github_template_owner,
        "KALPZERO_GITHUB_TEMPLATE_REPO": settings.github_template_repo,
    }
    if settings.website_provider == "github_vercel":
        required_settings["KALPZERO_VERCEL_TOKEN"] = settings.vercel_token
    return [name for name, value in required_settings.items() if not value]


def serialize_website_domains(domains: list[object] | None) -> list[dict[str, object]]:
    serialized: list[dict[str, object]] = []
    for domain in domains or []:
        serialized.append(
            {
                "id": str(domain.id),
                "host": domain.host,
                "domain_kind": domain.domain_kind,
                "ssl_status": domain.ssl_status,
                "is_primary": domain.is_primary,
                "active": domain.active,
                "metadata": domain.metadata_json if isinstance(domain.metadata_json, dict) else {},
                "created_at": domain.created_at.isoformat() if getattr(domain, "created_at", None) else None,
                "updated_at": domain.updated_at.isoformat() if getattr(domain, "updated_at", None) else None,
            }
        )
    return serialized


def serialize_website_deployment(deployment, *, domains: list[object] | None = None) -> dict[str, object] | None:
    if deployment is None:
        return None

    metadata = deployment.metadata_json if isinstance(deployment.metadata_json, dict) else {}
    message = metadata.get("message")
    if not isinstance(message, str) or not message:
        message = deployment.last_error

    return {
        "id": str(deployment.id),
        "provider": deployment.provider,
        "status": deployment.status,
        "repo_name": deployment.repo_name,
        "repo_url": deployment.repo_url,
        "repo_id": deployment.repo_id,
        "vercel_project_id": deployment.vercel_project_id,
        "vercel_project_name": deployment.vercel_project_name,
        "deployment_id": deployment.deployment_id,
        "deployment_url": deployment.deployment_url,
        "production_url": deployment.production_url,
        "message": message,
        "last_error": deployment.last_error,
        "local_repo_path": metadata.get("local_repo_path"),
        "platform_url": metadata.get("platform_url"),
        "platform_host": metadata.get("platform_host"),
        "domains": serialize_website_domains(domains),
        "metadata": metadata,
        "created_at": deployment.created_at.isoformat() if getattr(deployment, "created_at", None) else None,
        "updated_at": deployment.updated_at.isoformat() if getattr(deployment, "updated_at", None) else None,
    }


def provision_business_website(
    db: Session,
    settings: Settings,
    *,
    tenant,
    actor_user_id: str,
    admin_email: str | None = None,
    primary_domains: list[str] | None = None,
):
    deployment = platform_repository.get_or_create_tenant_website_deployment(
        db,
        tenant_id=str(tenant.id),
        provider=settings.website_provider,
    )

    if deployment.status == "ready" and deployment.production_url:
        return deployment

    repo_name = build_repository_name(settings, tenant_slug=tenant.slug)
    project_name = build_project_name(settings, tenant_slug=tenant.slug)
    missing_settings = get_missing_website_automation_settings(settings)
    base_metadata = {
        "tenant_slug": tenant.slug,
        "tenant_display_name": tenant.display_name,
        "repo_name": repo_name,
        "project_name": project_name,
        "admin_email": admin_email,
        "requested_primary_domains": _normalize_requested_domains(primary_domains or [], tenant_slug=tenant.slug),
    }

    if missing_settings:
        message = "Business website automation is not configured. Missing: " + ", ".join(missing_settings) + "."
        deployment = _update_deployment(
            db,
            deployment,
            status="disabled",
            last_error=None,
            repo_name=repo_name,
            vercel_project_name=project_name,
            metadata={**base_metadata, "missing_settings": missing_settings},
            message=message,
        )
        platform_repository.create_audit_event(
            db,
            tenant_id=str(tenant.id),
            actor_user_id=actor_user_id,
            action="platform.website.provisioning.skipped",
            subject_type="tenant",
            subject_id=str(tenant.id),
            metadata_json={"slug": tenant.slug, "missing_settings": missing_settings},
        )
        db.commit()
        return deployment

    initial_message = (
        "Creating the business website repository, syncing a server checkout, and wiring the self-hosted public URL."
        if settings.website_provider == "github_self_hosted"
        else "Creating the business website repository and Vercel project."
    )

    deployment = _update_deployment(
        db,
        deployment,
        status="provisioning",
        last_error=None,
        repo_name=repo_name,
        vercel_project_name=project_name,
        metadata=base_metadata,
        message=initial_message,
    )
    db.commit()

    try:
        if settings.website_provider == "github_self_hosted":
            return _provision_github_self_hosted(
                db,
                settings,
                deployment=deployment,
                tenant=tenant,
                actor_user_id=actor_user_id,
                admin_email=admin_email,
                primary_domains=base_metadata["requested_primary_domains"],
            )

        return _provision_github_vercel(
            db,
            settings,
            deployment=deployment,
            tenant=tenant,
            actor_user_id=actor_user_id,
            admin_email=admin_email,
            repo_name=repo_name,
            project_name=project_name,
        )
    except WebsiteProvisioningError as exc:
        message = str(exc)
    except Exception as exc:  # pragma: no cover - defensive fallback
        logger.exception("Unexpected business website provisioning failure for tenant %s", tenant.slug)
        message = "Unexpected business website provisioning failure."

    deployment = _update_deployment(
        db,
        deployment,
        status="failed",
        last_error=message,
        metadata={"provisioning_failed": True},
        message=message,
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="platform.website.provisioning.failed",
        subject_type="tenant",
        subject_id=str(tenant.id),
        metadata_json={
            "slug": tenant.slug,
            "repo_name": deployment.repo_name,
            "project_name": deployment.vercel_project_name,
            "error": message,
        },
    )
    db.commit()
    return deployment


def sync_self_hosted_website_domains(
    db: Session,
    settings: Settings,
    *,
    tenant,
    actor_user_id: str,
    admin_email: str | None = None,
):
    deployment = platform_repository.get_or_create_tenant_website_deployment(
        db,
        tenant_id=str(tenant.id),
        provider=settings.website_provider,
    )
    requested_primary_domains = deployment.metadata_json.get("requested_primary_domains")
    normalized_primary_domains = (
        [normalize_host(value) for value in requested_primary_domains if isinstance(value, str)]
        if isinstance(requested_primary_domains, list)
        else []
    )

    _sync_self_hosted_domains(
        db,
        settings,
        tenant_id=str(tenant.id),
        tenant_slug=tenant.slug,
        primary_domains=normalized_primary_domains,
    )
    _, production_url, message = _activate_self_hosted_domains(
        db,
        settings,
        tenant=tenant,
        admin_email=admin_email or deployment.metadata_json.get("admin_email"),
    )

    deployment = _update_deployment(
        db,
        deployment,
        status="ready",
        production_url=production_url,
        deployment_url=production_url,
        metadata={
            "platform_host": _build_platform_subdomain_host(settings, tenant_slug=tenant.slug),
            "platform_url": _build_subdomain_url(
                settings,
                host=_build_platform_subdomain_host(settings, tenant_slug=tenant.slug),
            ),
            "requested_primary_domains": normalized_primary_domains,
        },
        message=message,
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="platform.website.domains.synced",
        subject_type="tenant",
        subject_id=str(tenant.id),
        metadata_json={
            "slug": tenant.slug,
            "production_url": production_url,
            "platform_host": _build_platform_subdomain_host(settings, tenant_slug=tenant.slug),
        },
    )
    db.commit()
    return deployment


def _provision_github_vercel(
    db: Session,
    settings: Settings,
    *,
    deployment,
    tenant,
    actor_user_id: str,
    admin_email: str | None,
    repo_name: str,
    project_name: str,
):
    repo_response = _create_github_repository_from_template(
        settings,
        repo_name=repo_name,
        description=f"Business website for {tenant.display_name}",
    )
    deployment = _update_deployment(
        db,
        deployment,
        status="repo_created",
        repo_name=repo_response.get("name") or repo_name,
        repo_url=repo_response.get("html_url"),
        repo_id=str(repo_response["id"]) if repo_response.get("id") is not None else None,
        metadata={
            "github_full_name": repo_response.get("full_name"),
            "github_default_branch": repo_response.get("default_branch"),
        },
        message="GitHub repository created from the business website template.",
    )
    db.commit()

    project_response = _create_vercel_project(
        settings,
        project_name=project_name,
        repo_name=deployment.repo_name or repo_name,
    )
    deployment = _update_deployment(
        db,
        deployment,
        status="project_created",
        vercel_project_id=project_response.get("id"),
        vercel_project_name=project_response.get("name") or project_name,
        metadata={
            "vercel_project_link": project_response.get("link"),
        },
        message="Vercel project created and connected to the GitHub repository.",
    )
    db.commit()

    env_payload = _build_vercel_environment_variables(
        settings,
        tenant_slug=tenant.slug,
        tenant_display_name=tenant.display_name,
        admin_email=admin_email,
    )
    _upsert_vercel_project_environment_variables(
        settings,
        project_name=deployment.vercel_project_name or project_name,
        environment_variables=env_payload,
    )
    deployment = _update_deployment(
        db,
        deployment,
        status="deploying",
        metadata={"vercel_environment_keys": [item["key"] for item in env_payload]},
        message="Vercel environment variables synced. Starting the first production deployment.",
    )
    db.commit()

    create_response = _create_vercel_deployment(
        settings,
        project_name=deployment.vercel_project_name or project_name,
        repo_name=deployment.repo_name or repo_name,
    )
    deployment_url = _select_vercel_public_url(create_response)
    deployment = _update_deployment(
        db,
        deployment,
        status="deploying",
        deployment_id=create_response.get("id"),
        deployment_url=deployment_url,
        production_url=deployment_url,
        metadata={"vercel_initial_status": _deployment_status(create_response)},
        message="Vercel production deployment started.",
    )
    db.commit()

    final_response = _wait_for_vercel_deployment(
        settings,
        deployment_id=deployment.deployment_id,
        initial_response=create_response,
    )
    final_status = _deployment_status(final_response)
    final_url = _select_vercel_public_url(final_response) or deployment.production_url

    if final_status == "READY":
        deployment = _update_deployment(
            db,
            deployment,
            status="ready",
            deployment_url=final_url,
            production_url=final_url,
            last_error=None,
            metadata={"vercel_final_status": final_status},
            message="Business website repo created and the first Vercel production deployment is live.",
        )
        platform_repository.create_audit_event(
            db,
            tenant_id=str(tenant.id),
            actor_user_id=actor_user_id,
            action="platform.website.provisioned",
            subject_type="tenant",
            subject_id=str(tenant.id),
            metadata_json={
                "slug": tenant.slug,
                "repo_url": deployment.repo_url,
                "production_url": deployment.production_url,
            },
        )
        db.commit()
        return deployment

    if final_status in {"ERROR", "CANCELED"}:
        error_message = final_response.get("errorMessage")
        detail = f"Vercel deployment finished with status {final_status.lower()}."
        if error_message:
            detail = f"{detail} {error_message}"
        raise WebsiteProvisioningError(detail)

    deployment = _update_deployment(
        db,
        deployment,
        status="deploying",
        deployment_url=final_url,
        production_url=final_url,
        metadata={"vercel_final_status": final_status},
        message=f"Vercel deployment is still {final_status.lower()} but the deployment URL has been issued.",
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="platform.website.provisioning.started",
        subject_type="tenant",
        subject_id=str(tenant.id),
        metadata_json={
            "slug": tenant.slug,
            "repo_url": deployment.repo_url,
            "deployment_url": deployment.deployment_url,
        },
    )
    db.commit()
    return deployment


def _provision_github_self_hosted(
    db: Session,
    settings: Settings,
    *,
    deployment,
    tenant,
    actor_user_id: str,
    admin_email: str | None,
    primary_domains: list[str],
):
    repo_name = build_repository_name(settings, tenant_slug=tenant.slug)
    repo_response = _create_github_repository_from_template(
        settings,
        repo_name=repo_name,
        description=f"Business website for {tenant.display_name}",
    )
    deployment = _update_deployment(
        db,
        deployment,
        status="repo_created",
        repo_name=repo_response.get("name") or repo_name,
        repo_url=repo_response.get("html_url"),
        repo_id=str(repo_response["id"]) if repo_response.get("id") is not None else None,
        deployment_id=None,
        deployment_url=None,
        vercel_project_id=None,
        vercel_project_name=None,
        metadata={
            "github_full_name": repo_response.get("full_name"),
            "github_default_branch": repo_response.get("default_branch"),
        },
        message="GitHub repository created from the business website template.",
    )
    db.commit()

    local_repo_path = _sync_local_repository_checkout(
        settings,
        repo_name=deployment.repo_name or repo_name,
    )
    platform_host = _build_platform_subdomain_host(settings, tenant_slug=tenant.slug)
    _sync_self_hosted_domains(
        db,
        settings,
        tenant_id=str(tenant.id),
        tenant_slug=tenant.slug,
        primary_domains=primary_domains,
    )
    _domains, production_url, provisioning_message = _activate_self_hosted_domains(
        db,
        settings,
        tenant=tenant,
        admin_email=admin_email,
    )

    deployment = _update_deployment(
        db,
        deployment,
        status="ready",
        production_url=production_url,
        deployment_url=production_url,
        metadata={
            "local_repo_path": local_repo_path,
            "platform_host": platform_host,
            "platform_url": _build_subdomain_url(settings, host=platform_host),
            "public_url_mode": settings.website_public_url_mode,
            "requested_primary_domains": primary_domains,
        },
        message=provisioning_message,
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="platform.website.provisioned",
        subject_type="tenant",
        subject_id=str(tenant.id),
        metadata_json={
            "slug": tenant.slug,
            "repo_url": deployment.repo_url,
            "production_url": deployment.production_url,
            "local_repo_path": local_repo_path,
            "primary_domains": primary_domains,
        },
    )
    db.commit()
    return deployment


def _update_deployment(
    db: Session,
    deployment,
    *,
    status: str,
    metadata: dict[str, Any] | None = None,
    message: str | None = None,
    **fields,
):
    merged_metadata = dict(deployment.metadata_json or {})
    if status != "failed":
        merged_metadata.pop("provisioning_failed", None)
    if metadata:
        merged_metadata.update({key: value for key, value in metadata.items() if value is not None})
    if message is not None:
        merged_metadata["message"] = message
    if status != "failed" and "last_error" not in fields:
        fields["last_error"] = None
    fields["status"] = status
    fields["metadata_json"] = merged_metadata
    return platform_repository.update_tenant_website_deployment(db, deployment, **fields)


def _create_github_repository_from_template(
    settings: Settings,
    *,
    repo_name: str,
    description: str,
) -> dict[str, object]:
    return _request_json(
        "POST",
        f"{GITHUB_API_BASE}/repos/{settings.github_template_owner}/{settings.github_template_repo}/generate",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {settings.github_token}",
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        payload={
            "owner": settings.github_repo_owner,
            "name": repo_name,
            "description": description,
            "include_all_branches": False,
            "private": settings.website_repo_private,
        },
    )


def normalize_host(value: str) -> str:
    candidate = (value or "").strip().lower()
    if not candidate:
        return ""
    if "://" in candidate:
        parsed = urlparse(candidate)
        candidate = parsed.netloc or parsed.path
    candidate = candidate.split("/", maxsplit=1)[0].strip()
    if ":" in candidate:
        candidate = candidate.split(":", maxsplit=1)[0].strip()
    return candidate.strip(".")


def resolve_public_website_host(
    db: Session,
    settings: Settings,
    *,
    host: str,
) -> dict[str, object] | None:
    normalized_host = normalize_host(host)
    if not normalized_host:
        return None

    root_host = settings.website_root_host
    if normalized_host in {root_host, f"www.{root_host}"}:
        return None

    stored_domain = platform_repository.get_tenant_website_domain_by_host(db, host=normalized_host)
    if stored_domain is not None and stored_domain.active:
        tenant = platform_repository.get_tenant_by_id(db, id=str(stored_domain.tenant_id))
        if tenant is not None:
            return {
                "tenant_id": str(tenant.id),
                "tenant_slug": tenant.slug,
                "host": normalized_host,
                "domain_kind": stored_domain.domain_kind,
                "ssl_status": stored_domain.ssl_status,
                "production_url": _build_subdomain_url(settings, host=normalized_host),
            }

    suffix = f".{root_host}"
    if not normalized_host.endswith(suffix):
        return None

    label = normalized_host[: -len(suffix)].strip(".")
    if not label or "." in label:
        return None
    if label in settings.website_reserved_subdomain_labels:
        return None

    tenant = platform_repository.get_tenant_by_slug(db, slug=label)
    if tenant is None:
        return None

    return {
        "tenant_id": str(tenant.id),
        "tenant_slug": tenant.slug,
        "host": normalized_host,
        "domain_kind": "platform_subdomain",
        "ssl_status": "pending_dns",
        "production_url": _build_subdomain_url(settings, host=normalized_host),
    }


def _normalize_requested_domains(values: list[str], *, tenant_slug: str) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for raw_value in values:
        host = normalize_host(raw_value)
        if not host:
            continue
        if host.startswith("."):
            host = f"{tenant_slug}{host}"
        if "." not in host:
            continue
        if host in seen:
            continue
        seen.add(host)
        normalized.append(host)
    return normalized


def _build_platform_subdomain_host(settings: Settings, *, tenant_slug: str) -> str:
    return f"{_sanitize_identifier(tenant_slug, max_length=63)}.{settings.website_root_host}"


def _public_base_url(settings: Settings) -> str:
    return settings.public_web_url.rstrip("/")


def _build_subdomain_url(settings: Settings, *, host: str) -> str:
    parsed = urlparse(_public_base_url(settings))
    scheme = parsed.scheme or "https"
    return f"{scheme}://{host}"


def _build_self_hosted_public_url(settings: Settings, *, tenant_slug: str) -> str:
    if settings.website_public_url_mode == "subdomain":
        return _build_subdomain_url(
            settings,
            host=_build_platform_subdomain_host(settings, tenant_slug=tenant_slug),
        )
    return f"{_public_base_url(settings)}/{tenant_slug}"


def _timestamp_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def _resolve_server_public_ips(settings: Settings) -> set[str]:
    candidates: set[str] = set()
    explicit = normalize_host(settings.website_server_public_ip or "")
    if explicit:
        candidates.add(explicit)

    for host in {settings.website_root_host, normalize_host(urlparse(settings.public_web_url).hostname or "")}:
        if not host:
            continue
        try:
            _, _, addresses = socket.gethostbyname_ex(host)
        except OSError:
            continue
        for address in addresses:
            normalized = normalize_host(address)
            if normalized:
                candidates.add(normalized)

    return candidates


def _lookup_host_ips(host: str) -> set[str]:
    resolved: set[str] = set()
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return resolved

    for info in infos:
        sockaddr = info[4]
        if not sockaddr:
            continue
        candidate = normalize_host(str(sockaddr[0]))
        if candidate:
            resolved.add(candidate)
    return resolved


def _merge_domain_metadata(domain, extra: dict[str, object]) -> dict[str, object]:
    metadata = dict(domain.metadata_json or {})
    for key, value in extra.items():
        if value is not None:
            metadata[key] = value
    return metadata


def _pending_dns_message(settings: Settings, *, host: str, domain_kind: str, expected_ips: set[str]) -> str:
    ip_hint = ", ".join(sorted(expected_ips)) if expected_ips else "this server"
    if domain_kind == "platform_subdomain" and host.endswith(f".{settings.website_root_host}"):
        return (
            f"DNS is not pointing {host} to {ip_hint} yet. Add a wildcard or an A record for this subdomain,"
            " then run domain sync again."
        )
    return f"DNS is not pointing {host} to {ip_hint} yet. Point the domain to this server, then run domain sync again."


def _build_domain_sync_message(*, ready_hosts: list[str], pending_dns_hosts: list[str], failed_hosts: list[str]) -> str:
    parts = ["Business website repo created and synced to the server."]
    if ready_hosts:
        label = "domain is live" if len(ready_hosts) == 1 else "domains are live"
        parts.append(f"{len(ready_hosts)} {label}: {', '.join(ready_hosts)}.")
    if pending_dns_hosts:
        label = "domain is waiting for DNS" if len(pending_dns_hosts) == 1 else "domains are waiting for DNS"
        parts.append(f"{len(pending_dns_hosts)} {label}: {', '.join(pending_dns_hosts)}.")
    if failed_hosts:
        label = "domain needs operator attention" if len(failed_hosts) == 1 else "domains need operator attention"
        parts.append(f"{len(failed_hosts)} {label}: {', '.join(failed_hosts)}.")
    return " ".join(parts)


def _select_self_hosted_production_url(
    settings: Settings,
    *,
    tenant_slug: str,
    domains: list[object],
) -> str:
    def pick(predicate):
        for domain in domains:
            if predicate(domain):
                return _build_subdomain_url(settings, host=domain.host)
        return None

    primary_custom = pick(
        lambda item: item.active and item.is_primary and item.domain_kind == "custom" and item.ssl_status == "ready"
    )
    if primary_custom:
        return primary_custom

    any_custom = pick(lambda item: item.active and item.domain_kind == "custom" and item.ssl_status == "ready")
    if any_custom:
        return any_custom

    platform_subdomain = pick(
        lambda item: item.active and item.domain_kind == "platform_subdomain" and item.ssl_status == "ready"
    )
    if platform_subdomain:
        return platform_subdomain

    return _build_self_hosted_public_url(settings, tenant_slug=tenant_slug)


def _run_domain_provisioner(settings: Settings, *, host: str, email: str) -> dict[str, object]:
    provisioner_path = Path(settings.website_domain_provisioner_command)
    if not provisioner_path.exists():
        raise WebsiteProvisioningError(
            f"Self-hosted domain provisioner is not installed at {settings.website_domain_provisioner_command}."
        )

    command = [
        str(provisioner_path),
        "--host",
        host,
        "--web-upstream",
        "127.0.0.1:3002",
        "--api-upstream",
        "127.0.0.1:8012",
        "--email",
        email,
    ]
    if settings.website_domain_provisioner_sudo:
        command = ["sudo", "-n", *command]

    try:
        completed = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=DOMAIN_PROVISION_TIMEOUT_SECONDS,
        )
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or exc.stdout.strip() or "domain provisioner failed"
        raise WebsiteProvisioningError(detail) from exc
    except subprocess.TimeoutExpired as exc:
        raise WebsiteProvisioningError("Timed out while provisioning the nginx and SSL config for the domain.") from exc

    stdout = completed.stdout.strip()
    if not stdout:
        return {}
    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return {"raw_output": stdout}
    return payload if isinstance(payload, dict) else {"raw_output": stdout}


def _activate_self_hosted_domains(
    db: Session,
    settings: Settings,
    *,
    tenant,
    admin_email: str | None,
) -> tuple[list[object], str, str]:
    domains = platform_repository.list_tenant_website_domains(db, tenant_id=str(tenant.id))
    contact_email = (settings.website_acme_email or admin_email or "").strip()
    expected_ips = _resolve_server_public_ips(settings)
    ready_hosts: list[str] = []
    pending_dns_hosts: list[str] = []
    failed_hosts: list[str] = []
    refreshed_domains: list[object] = []

    for domain in domains:
        observed_ips = _lookup_host_ips(domain.host)
        shared_metadata = {
            "tenant_slug": tenant.slug,
            "expected_server_ips": sorted(expected_ips),
            "observed_ips": sorted(observed_ips),
            "last_checked_at": _timestamp_iso(),
        }

        if expected_ips and not observed_ips.intersection(expected_ips):
            message = _pending_dns_message(
                settings,
                host=domain.host,
                domain_kind=domain.domain_kind,
                expected_ips=expected_ips,
            )
            domain = platform_repository.update_tenant_website_domain(
                db,
                domain,
                ssl_status="pending_dns",
                active=True,
                metadata_json=_merge_domain_metadata(
                    domain,
                    {
                        **shared_metadata,
                        "message": message,
                        "last_error": None,
                    },
                ),
            )
            pending_dns_hosts.append(domain.host)
            refreshed_domains.append(domain)
            continue

        if not contact_email:
            message = "SSL automation requires KALPZERO_WEBSITE_ACME_EMAIL or an owner admin email."
            domain = platform_repository.update_tenant_website_domain(
                db,
                domain,
                ssl_status="error",
                active=True,
                metadata_json=_merge_domain_metadata(
                    domain,
                    {
                        **shared_metadata,
                        "message": message,
                        "last_error": message,
                    },
                ),
            )
            failed_hosts.append(domain.host)
            refreshed_domains.append(domain)
            continue

        try:
            provisioner_payload = _run_domain_provisioner(settings, host=domain.host, email=contact_email)
        except WebsiteProvisioningError as exc:
            message = str(exc)
            domain = platform_repository.update_tenant_website_domain(
                db,
                domain,
                ssl_status="error",
                active=True,
                metadata_json=_merge_domain_metadata(
                    domain,
                    {
                        **shared_metadata,
                        "message": message,
                        "last_error": message,
                    },
                ),
            )
            failed_hosts.append(domain.host)
            refreshed_domains.append(domain)
            continue

        message = "HTTPS is live for this domain."
        domain = platform_repository.update_tenant_website_domain(
            db,
            domain,
            ssl_status="ready",
            active=True,
            metadata_json=_merge_domain_metadata(
                domain,
                {
                    **shared_metadata,
                    "message": message,
                    "activated_at": _timestamp_iso(),
                    "https_url": _build_subdomain_url(settings, host=domain.host),
                    "provisioner": provisioner_payload,
                    "last_error": None,
                },
            ),
        )
        ready_hosts.append(domain.host)
        refreshed_domains.append(domain)

    production_url = _select_self_hosted_production_url(settings, tenant_slug=tenant.slug, domains=refreshed_domains)
    message = _build_domain_sync_message(
        ready_hosts=ready_hosts,
        pending_dns_hosts=pending_dns_hosts,
        failed_hosts=failed_hosts,
    )
    return refreshed_domains, production_url, message


def _run_git_command(*args: str, cwd: Path | None = None) -> None:
    try:
        subprocess.run(
            args,
            cwd=str(cwd) if cwd else None,
            check=True,
            capture_output=True,
            text=True,
            timeout=180,
        )
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or exc.stdout.strip() or "git command failed"
        raise WebsiteProvisioningError(detail) from exc
    except subprocess.TimeoutExpired as exc:
        raise WebsiteProvisioningError("Timed out while syncing the local website repository.") from exc


def _sync_local_repository_checkout(
    settings: Settings,
    *,
    repo_name: str,
) -> str:
    root = Path(settings.website_local_repo_root).expanduser()
    root.mkdir(parents=True, exist_ok=True)
    repo_path = root / repo_name
    repo_url = f"https://github.com/{settings.github_repo_owner}/{repo_name}.git"
    auth_header = f"AUTHORIZATION: bearer {settings.github_token}"

    if (repo_path / ".git").exists():
        _run_git_command(
            "git",
            "-c",
            f"http.extraheader={auth_header}",
            "fetch",
            "origin",
            settings.github_default_branch,
            "--depth",
            "1",
            cwd=repo_path,
        )
        _run_git_command("git", "reset", "--hard", "FETCH_HEAD", cwd=repo_path)
        _run_git_command("git", "clean", "-fd", cwd=repo_path)
        return str(repo_path)

    _run_git_command(
        "git",
        "-c",
        f"http.extraheader={auth_header}",
        "clone",
        "--depth",
        "1",
        "--branch",
        settings.github_default_branch,
        repo_url,
        str(repo_path),
    )
    return str(repo_path)


def _sync_self_hosted_domains(
    db: Session,
    settings: Settings,
    *,
    tenant_id: str,
    tenant_slug: str,
    primary_domains: list[str],
) -> None:
    platform_host = _build_platform_subdomain_host(settings, tenant_slug=tenant_slug)
    platform_repository.upsert_tenant_website_domain(
        db,
        tenant_id=tenant_id,
        host=platform_host,
        domain_kind="platform_subdomain",
        ssl_status="pending_dns",
        is_primary=not primary_domains,
        active=True,
        metadata_json={"tenant_slug": tenant_slug},
    )

    for index, host in enumerate(primary_domains):
        platform_repository.upsert_tenant_website_domain(
            db,
            tenant_id=tenant_id,
            host=host,
            domain_kind="custom",
            ssl_status="pending_dns",
            is_primary=index == 0,
            active=True,
            metadata_json={"tenant_slug": tenant_slug},
        )


def _create_vercel_project(
    settings: Settings,
    *,
    project_name: str,
    repo_name: str,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": project_name,
        "framework": "nextjs",
        "gitRepository": {
            "type": "github",
            "repo": repo_name,
            "org": settings.github_repo_owner,
        },
    }
    if settings.vercel_root_directory:
        payload["rootDirectory"] = settings.vercel_root_directory
    if settings.vercel_install_command:
        payload["installCommand"] = settings.vercel_install_command
    if settings.vercel_build_command:
        payload["buildCommand"] = settings.vercel_build_command
    if settings.vercel_output_directory:
        payload["outputDirectory"] = settings.vercel_output_directory

    return _request_json(
        "POST",
        f"{VERCEL_API_BASE}/v11/projects{_vercel_query(settings)}",
        headers={
            "Authorization": f"Bearer {settings.vercel_token}",
        },
        payload=payload,
    )


def _upsert_vercel_project_environment_variables(
    settings: Settings,
    *,
    project_name: str,
    environment_variables: list[dict[str, object]],
) -> dict[str, object]:
    return _request_json(
        "POST",
        f"{VERCEL_API_BASE}/v10/projects/{project_name}/env{_vercel_query(settings, upsert='true')}",
        headers={
            "Authorization": f"Bearer {settings.vercel_token}",
        },
        payload=environment_variables,
    )


def _create_vercel_deployment(
    settings: Settings,
    *,
    project_name: str,
    repo_name: str,
) -> dict[str, object]:
    return _request_json(
        "POST",
        f"{VERCEL_API_BASE}/v13/deployments{_vercel_query(settings, forceNew='1', skipAutoDetectionConfirmation='1')}",
        headers={
            "Authorization": f"Bearer {settings.vercel_token}",
        },
        payload={
            "name": project_name,
            "project": project_name,
            "target": "production",
            "gitSource": {
                "type": "github",
                "repo": repo_name,
                "ref": settings.github_default_branch,
                "org": settings.github_repo_owner,
            },
        },
    )


def _get_vercel_deployment(settings: Settings, *, deployment_id: str) -> dict[str, object]:
    return _request_json(
        "GET",
        f"{VERCEL_API_BASE}/v13/deployments/{deployment_id}{_vercel_query(settings, withGitRepoInfo='true')}",
        headers={
            "Authorization": f"Bearer {settings.vercel_token}",
        },
    )


def _wait_for_vercel_deployment(
    settings: Settings,
    *,
    deployment_id: str | None,
    initial_response: dict[str, object],
) -> dict[str, object]:
    if not deployment_id:
        return initial_response

    response = initial_response
    if _deployment_status(response) not in PENDING_DEPLOYMENT_STATUSES:
        return response

    for _ in range(DEPLOYMENT_POLL_ATTEMPTS):
        time.sleep(DEPLOYMENT_POLL_INTERVAL_SECONDS)
        response = _get_vercel_deployment(settings, deployment_id=deployment_id)
        if _deployment_status(response) not in PENDING_DEPLOYMENT_STATUSES:
            return response

    return response


def _build_vercel_environment_variables(
    settings: Settings,
    *,
    tenant_slug: str,
    tenant_display_name: str,
    admin_email: str | None,
) -> list[dict[str, object]]:
    values = [
        {
            "key": "NEXT_PUBLIC_KALPZERO_API_URL",
            "value": settings.public_api_url.rstrip("/"),
            "target": ["production", "preview", "development"],
            "type": "plain",
        },
        {
            "key": "NEXT_PUBLIC_KALPZERO_TENANT_SLUG",
            "value": tenant_slug,
            "target": ["production", "preview", "development"],
            "type": "plain",
        },
        {
            "key": "KALPZERO_TENANT_SLUG",
            "value": tenant_slug,
            "target": ["production", "preview", "development"],
            "type": "plain",
        },
        {
            "key": "NEXT_PUBLIC_KALPZERO_TENANT_DISPLAY_NAME",
            "value": tenant_display_name,
            "target": ["production", "preview", "development"],
            "type": "plain",
        },
    ]
    if admin_email:
        values.append(
            {
                "key": "KALPZERO_OWNER_ADMIN_EMAIL",
                "value": admin_email,
                "target": ["production", "preview", "development"],
                "type": "plain",
            }
        )
    return values


def _vercel_query(settings: Settings, **query_values: str) -> str:
    query: dict[str, str] = {}
    if settings.vercel_team_id:
        query["teamId"] = settings.vercel_team_id
    elif settings.vercel_team_slug:
        query["slug"] = settings.vercel_team_slug

    query.update({key: value for key, value in query_values.items() if value})
    return f"?{urlencode(query)}" if query else ""


def _deployment_status(payload: dict[str, object]) -> str:
    status = payload.get("status") or payload.get("readyState") or "UNKNOWN"
    return str(status).upper()


def _select_vercel_public_url(payload: dict[str, object]) -> str | None:
    for key in ("aliasFinal",):
        value = payload.get(key)
        if isinstance(value, str) and value:
            return _normalize_public_url(value)

    for key in ("alias", "automaticAliases", "userAliases"):
        value = payload.get(key)
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str) and item:
                    return _normalize_public_url(item)

    value = payload.get("url")
    if isinstance(value, str) and value:
        return _normalize_public_url(value)

    return None


def _normalize_public_url(value: str) -> str:
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"https://{value}"


def _request_json(
    method: str,
    url: str,
    *,
    headers: dict[str, str],
    payload: dict[str, object] | list[dict[str, object]] | None = None,
) -> dict[str, object]:
    request_headers = {
        "User-Agent": USER_AGENT,
        **headers,
    }
    request_body = None
    if payload is not None:
        request_body = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    request = Request(url, data=request_body, headers=request_headers, method=method)
    try:
        with urlopen(request, timeout=60) as response:
            raw = response.read()
    except HTTPError as exc:
        message = _extract_error_message(exc)
        raise WebsiteProvisioningError(f"External provisioning request failed with HTTP {exc.code}: {message}") from exc
    except URLError as exc:
        raise WebsiteProvisioningError(f"External provisioning request failed: {exc.reason}") from exc

    if not raw:
        return {}

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise WebsiteProvisioningError("External provisioning service returned invalid JSON.") from exc


def _extract_error_message(exc: HTTPError) -> str:
    try:
        raw = exc.read()
    except Exception:  # pragma: no cover - best effort only
        return exc.reason or "Unknown error"

    if not raw:
        return exc.reason or "Unknown error"

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return raw.decode("utf-8", errors="replace")

    if isinstance(payload, dict):
        message = payload.get("message")
        if isinstance(message, str) and message:
            return message
        error = payload.get("error")
        if isinstance(error, dict):
            nested_message = error.get("message")
            if isinstance(nested_message, str) and nested_message:
                return nested_message
        errors = payload.get("errors")
        if isinstance(errors, list) and errors:
            first_error = errors[0]
            if isinstance(first_error, dict):
                nested_message = first_error.get("message") or first_error.get("code")
                if isinstance(nested_message, str) and nested_message:
                    return nested_message
            if isinstance(first_error, str):
                return first_error

    return json.dumps(payload)
