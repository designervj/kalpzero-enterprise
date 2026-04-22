import json
import logging
import re
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
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
    required_settings = {
        "KALPZERO_GITHUB_TOKEN": settings.github_token,
        "KALPZERO_GITHUB_REPO_OWNER": settings.github_repo_owner,
        "KALPZERO_GITHUB_TEMPLATE_OWNER": settings.github_template_owner,
        "KALPZERO_GITHUB_TEMPLATE_REPO": settings.github_template_repo,
        "KALPZERO_VERCEL_TOKEN": settings.vercel_token,
    }
    return [name for name, value in required_settings.items() if not value]


def serialize_website_deployment(deployment) -> dict[str, object] | None:
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
):
    deployment = platform_repository.get_or_create_tenant_website_deployment(
        db,
        tenant_id=str(tenant.id),
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

    deployment = _update_deployment(
        db,
        deployment,
        status="provisioning",
        last_error=None,
        repo_name=repo_name,
        vercel_project_name=project_name,
        metadata=base_metadata,
        message="Creating the business website repository and Vercel project.",
    )
    db.commit()

    try:
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
