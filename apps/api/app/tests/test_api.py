from pathlib import Path
import sys

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.tests._direct import ensure_project_python, run_current_test_file

ensure_project_python(__file__, is_main=__name__ == "__main__")

from fastapi.testclient import TestClient

from app.tests.support import login, provision_tenant


def test_health_routes_are_public(client: TestClient) -> None:
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_me_returns_current_session(client: TestClient) -> None:
    token = login(client, email="founder@kalpzero.com")

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"]
    assert payload["email"] == "founder@kalpzero.com"
    assert payload["tenant_id"] == "platform_control"
    assert payload["role"] == "platform_admin"
    assert payload["name"] == "Platform Founder"
    assert payload["isTenantOwner"] is False


def test_registry_requires_authentication(client: TestClient) -> None:
    response = client.get("/platform/registry")

    assert response.status_code == 401


def test_storage_topology_exposes_hybrid_layout(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")

    response = client.get(
        "/platform/storage-topology",
        headers={"Authorization": f"Bearer {platform_token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["control_plane"]["kind"] == "sql"
    assert payload["runtime_documents"]["kind"] == "mongo"
    assert payload["runtime_documents"]["tenant_database_strategy"] == "per_tenant_database"
    assert payload["ops_cache_queue"]["kind"] == "redis"


def test_onboarding_readiness_reports_supported_verticals(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")

    response = client.get(
        "/platform/onboarding-readiness",
        headers={"Authorization": f"Bearer {platform_token}"},
        params=[("requested_vertical_packs", "commerce"), ("requested_vertical_packs", "hotel"), ("infra_mode", "dedicated"), ("dedicated_profile_id", "dedicated-infra-demo")],
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["ready"] is True
    assert payload["supported_vertical_packs"] == ["commerce", "hotel"]
    assert payload["planned_vertical_packs"] == ["clinic", "lms", "real_estate", "school", "single_doctor", "travel"]
    assert payload["requested_vertical_packs"] == ["commerce", "hotel"]
    assert payload["vertical_readiness"]["commerce"]["status"] == "pilot_ready"
    assert "commerce.inventory" in payload["vertical_readiness"]["commerce"]["modules"]
    assert "commerce.fulfillment" in payload["vertical_readiness"]["commerce"]["modules"]
    assert "commerce.finance" in payload["vertical_readiness"]["commerce"]["modules"]


def test_onboarding_readiness_blocks_travel_until_pilot_scope_changes(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")

    response = client.get(
        "/platform/onboarding-readiness",
        headers={"Authorization": f"Bearer {platform_token}"},
        params=[("requested_vertical_packs", "travel"), ("infra_mode", "shared")],
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["ready"] is False
    assert "not approved for onboarding yet" in payload["blockers"][0]
    assert payload["vertical_readiness"]["travel"]["status"] == "in_progress"


def test_platform_admin_can_create_agency_and_tenant(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": "enterprise-agency",
            "name": "Enterprise Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    assert agency_response.status_code == 201

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": "enterprise-agency",
            "slug": "enterprise-tenant",
            "display_name": "Enterprise Tenant",
            "infra_mode": "shared",
            "vertical_pack": "commerce",
            "feature_flags": ["seo-suite"],
        },
    )
    assert tenant_response.status_code == 201
    tenant_payload = tenant_response.json()
    assert tenant_payload["vertical_packs"] == ["commerce"]
    assert tenant_payload["runtime_documents"]["database"] == "kalpzero_runtime_test__tenant__enterprise_tenant"
    assert tenant_payload["runtime_documents"]["bootstrap"]["seeded_document_count"] >= 5
    assert tenant_payload["website_deployment"]["status"] == "disabled"
    assert "KALPZERO_GITHUB_TOKEN" in tenant_payload["website_deployment"]["message"]

    response = client.get(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
    )
    assert response.status_code == 200
    tenants = response.json()["tenants"]
    assert len(tenants) == 1
    assert tenants[0]["runtime_documents"]["database"] == "kalpzero_runtime_test__tenant__enterprise_tenant"
    assert tenants[0]["website_deployment"]["status"] == "disabled"


def test_platform_admin_can_provision_business_website_repo_and_vercel_project(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setenv("KALPZERO_GITHUB_TOKEN", "ghs_test_token")
    monkeypatch.setenv("KALPZERO_GITHUB_REPO_OWNER", "kalp-sites")
    monkeypatch.setenv("KALPZERO_GITHUB_TEMPLATE_OWNER", "kalp-templates")
    monkeypatch.setenv("KALPZERO_GITHUB_TEMPLATE_REPO", "business-site-template")
    monkeypatch.setenv("KALPZERO_GITHUB_REPO_PREFIX", "kalp-biz")
    monkeypatch.setenv("KALPZERO_VERCEL_TOKEN", "vercel_test_token")
    monkeypatch.setenv("KALPZERO_VERCEL_PROJECT_PREFIX", "kalp-biz")

    from app.core.config import get_settings
    from app.services import website_provisioning

    get_settings.cache_clear()

    def fake_request(method: str, url: str, *, headers: dict[str, str], payload=None) -> dict[str, object]:
        if url == "https://api.github.com/repos/kalp-templates/business-site-template/generate":
            assert method == "POST"
            assert payload == {
                "owner": "kalp-sites",
                "name": "kalp-biz-vercel-tenant",
                "description": "Business website for Vercel Tenant",
                "include_all_branches": False,
                "private": True,
            }
            return {
                "id": 101,
                "name": "kalp-biz-vercel-tenant",
                "full_name": "kalp-sites/kalp-biz-vercel-tenant",
                "html_url": "https://github.com/kalp-sites/kalp-biz-vercel-tenant",
                "default_branch": "main",
            }

        if url == "https://api.vercel.com/v11/projects":
            assert method == "POST"
            assert payload == {
                "name": "kalp-biz-vercel-tenant",
                "framework": "nextjs",
                "gitRepository": {
                    "type": "github",
                    "repo": "kalp-biz-vercel-tenant",
                    "org": "kalp-sites",
                },
            }
            return {
                "id": "prj_101",
                "name": "kalp-biz-vercel-tenant",
                "link": {
                    "type": "github",
                    "repo": "kalp-biz-vercel-tenant",
                },
            }

        if url == "https://api.vercel.com/v10/projects/kalp-biz-vercel-tenant/env?upsert=true":
            assert method == "POST"
            assert payload is not None
            env_items = list(payload)
            assert any(item["key"] == "NEXT_PUBLIC_KALPZERO_TENANT_SLUG" and item["value"] == "vercel-tenant" for item in env_items)
            assert any(item["key"] == "KALPZERO_OWNER_ADMIN_EMAIL" and item["value"] == "owner@tenant.com" for item in env_items)
            return {"created": env_items, "failed": []}

        if (
            url
            == "https://api.vercel.com/v13/deployments?forceNew=1&skipAutoDetectionConfirmation=1"
        ):
            assert method == "POST"
            assert payload == {
                "name": "kalp-biz-vercel-tenant",
                "project": "kalp-biz-vercel-tenant",
                "target": "production",
                "gitSource": {
                    "type": "github",
                    "repo": "kalp-biz-vercel-tenant",
                    "ref": "main",
                    "org": "kalp-sites",
                },
            }
            return {
                "id": "dpl_101",
                "status": "READY",
                "url": "kalp-biz-vercel-tenant-branch123-upendrasingh12s-projects.vercel.app",
                "alias": ["kalp-biz-vercel-tenant.vercel.app"],
            }

        raise AssertionError(f"Unexpected external request: {method} {url}")

    monkeypatch.setattr(website_provisioning, "_request_json", fake_request)

    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": "vercel-agency",
            "name": "Vercel Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    assert agency_response.status_code == 201

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": "vercel-agency",
            "slug": "vercel-tenant",
            "display_name": "Vercel Tenant",
            "infra_mode": "shared",
            "vertical_pack": "commerce",
            "admin_email": "owner@tenant.com",
            "feature_flags": ["seo-suite"],
        },
    )

    assert tenant_response.status_code == 201
    website_deployment = tenant_response.json()["website_deployment"]
    assert website_deployment["status"] == "ready"
    assert website_deployment["repo_url"] == "https://github.com/kalp-sites/kalp-biz-vercel-tenant"
    assert website_deployment["repo_name"] == "kalp-biz-vercel-tenant"
    assert website_deployment["vercel_project_name"] == "kalp-biz-vercel-tenant"
    assert website_deployment["deployment_id"] == "dpl_101"
    assert website_deployment["production_url"] == "https://kalp-biz-vercel-tenant.vercel.app"
    assert website_deployment["message"] == "Business website repo created and the first Vercel production deployment is live."


def test_platform_admin_can_filter_audit_and_outbox_by_tenant_scope(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": "ops-agency",
            "name": "Ops Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    assert agency_response.status_code == 201

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": "ops-agency",
            "slug": "ops-tenant",
            "display_name": "Ops Tenant",
            "infra_mode": "shared",
            "vertical_pack": "commerce",
            "feature_flags": ["seo-suite"],
        },
    )
    assert tenant_response.status_code == 201

    platform_audit_response = client.get(
        "/platform/audit",
        headers={"Authorization": f"Bearer {platform_token}"},
    )
    tenant_audit_response = client.get(
        "/platform/audit",
        headers={"Authorization": f"Bearer {platform_token}"},
        params={"tenant_slug": "ops-tenant"},
    )
    tenant_outbox_response = client.get(
        "/platform/outbox",
        headers={"Authorization": f"Bearer {platform_token}"},
        params={"tenant_slug": "ops-tenant"},
    )

    assert platform_audit_response.status_code == 200
    assert tenant_audit_response.status_code == 200
    assert tenant_outbox_response.status_code == 200
    assert platform_audit_response.json()["tenant_id"] == "platform_control"
    assert any(event["action"] == "platform.agency.created" for event in platform_audit_response.json()["events"])
    assert tenant_audit_response.json()["tenant_id"] == "ops-tenant"
    assert any(event["action"] == "platform.tenant.created" for event in tenant_audit_response.json()["events"])
    assert any(event["event_name"] == "tenant.provisioned" for event in tenant_outbox_response.json()["events"])


def test_tenant_admin_cannot_query_another_tenant_scope(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="tenant_one", vertical_packs=["commerce"])
    provision_tenant(client, tenant_slug="tenant_two", vertical_packs=["hotel"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="tenant_one")

    audit_response = client.get(
        "/platform/audit",
        headers={"Authorization": f"Bearer {tenant_token}"},
        params={"tenant_slug": "tenant_two"},
    )
    outbox_response = client.get(
        "/platform/outbox",
        headers={"Authorization": f"Bearer {tenant_token}"},
        params={"tenant_slug": "tenant_two"},
    )

    assert audit_response.status_code == 403
    assert outbox_response.status_code == 403
    assert audit_response.json()["detail"] == "Permission denied for requested tenant scope."


def test_platform_admin_cannot_onboard_planned_verticals(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": "future-agency",
            "name": "Future Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    assert agency_response.status_code == 201

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": "future-agency",
            "slug": "future-tenant",
            "display_name": "Future Tenant",
            "infra_mode": "shared",
            "vertical_pack": "real_estate",
            "feature_flags": ["seo-suite"],
        },
    )

    assert tenant_response.status_code == 400
    assert "not approved for onboarding yet" in tenant_response.json()["detail"]


def test_platform_admin_cannot_create_dedicated_tenant_without_profile(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": "dedicated-agency",
            "name": "Dedicated Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    assert agency_response.status_code == 201

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": "dedicated-agency",
            "slug": "broken-dedicated",
            "display_name": "Broken Dedicated",
            "infra_mode": "dedicated",
            "vertical_pack": "commerce",
            "feature_flags": [],
        },
    )

    assert tenant_response.status_code == 400
    assert "dedicated_profile_id" in tenant_response.json()["detail"]


def test_platform_admin_rejects_legacy_multi_pack_tenant_payload(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": "legacy-agency",
            "name": "Legacy Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    assert agency_response.status_code == 201

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": "legacy-agency",
            "slug": "legacy-tenant",
            "display_name": "Legacy Tenant",
            "infra_mode": "shared",
            "vertical_packs": ["commerce", "hotel"],
            "feature_flags": [],
        },
    )

    assert tenant_response.status_code == 422


def test_registry_returns_pack_driven_payload_with_valid_token(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="tenant_demo", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="tenant_demo")

    response = client.get("/platform/registry", headers={"Authorization": f"Bearer {tenant_token}"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["tenant_id"] == "tenant_demo"
    assert "commerce.catalog" in payload["modules"]
    assert "commerce.inventory" in payload["modules"]
    assert "commerce.finance" in payload["modules"]
    assert "commerce.fulfillment" in payload["modules"]
    assert "hotel.reservations" not in payload["modules"]
    assert "travel.packages" not in payload["modules"]
    assert "dedicated-infra-profile" in payload["features"]


def test_tenant_onboarding_seeds_runtime_blueprint_and_pages(client: TestClient) -> None:
    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": "blueprint-agency",
            "name": "Blueprint Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    assert agency_response.status_code == 201

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": "blueprint-agency",
            "slug": "seeded-tenant",
            "display_name": "Seeded Tenant",
            "infra_mode": "shared",
            "vertical_pack": "hotel",
            "feature_flags": ["seo-suite"],
        },
    )
    assert tenant_response.status_code == 201

    tenant_token = login(client, email="ops@tenant.com", tenant_slug="seeded-tenant")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    blueprint_response = client.get("/publishing/blueprint", headers=headers)
    pages_response = client.get("/publishing/pages", headers=headers)

    assert blueprint_response.status_code == 200
    assert pages_response.status_code == 200
    assert blueprint_response.json()["business_label"] == "Seeded Tenant"
    page_slugs = {page["page_slug"] for page in pages_response.json()["pages"]}
    assert page_slugs >= {"home", "about", "contact", "stay"}
    assert "catalog" not in page_slugs


def test_import_source_and_job_creation_record_audit_and_outbox(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="tenant_imports", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="tenant_imports")

    source_response = client.post(
        "/imports/sources",
        headers={"Authorization": f"Bearer {tenant_token}"},
        json={
            "name": "Legacy Commerce ERP",
            "source_type": "postgres",
            "connection_profile_key": "secret://commerce-erp",
            "vertical_pack": "commerce",
            "config": {"schema": "public"},
        },
    )
    assert source_response.status_code == 201
    source_id = source_response.json()["id"]

    job_response = client.post(
        "/imports/jobs",
        headers={"Authorization": f"Bearer {tenant_token}"},
        json={"source_id": source_id, "mode": "dry_run"},
    )
    assert job_response.status_code == 201
    assert job_response.json()["job"]["status"] == "completed"
    assert job_response.json()["job"]["report"]["stage"] == "dry_run_complete"
    assert job_response.json()["outbox_event"]["event_name"] == "import.job.queued"
    assert job_response.json()["result_outbox_event"]["event_name"] == "import.job.completed"

    audit_response = client.get(
        "/platform/audit",
        headers={"Authorization": f"Bearer {tenant_token}"},
    )
    outbox_response = client.get(
        "/platform/outbox",
        headers={"Authorization": f"Bearer {tenant_token}"},
    )
    jobs_response = client.get(
        "/imports/jobs",
        headers={"Authorization": f"Bearer {tenant_token}"},
    )

    assert audit_response.status_code == 200
    assert outbox_response.status_code == 200
    assert jobs_response.status_code == 200
    assert any(event["action"] == "imports.job.created" for event in audit_response.json()["events"])
    assert any(event["action"] == "imports.job.completed" for event in audit_response.json()["events"])
    assert any(event["event_name"] == "tenant.provisioned" for event in outbox_response.json()["events"])
    assert any(event["event_name"] == "import.job.queued" for event in outbox_response.json()["events"])
    assert any(event["event_name"] == "import.job.completed" for event in outbox_response.json()["events"])
    assert len(jobs_response.json()["jobs"]) == 1


def test_imports_expose_external_hotel_plan(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="tenant_hotel_imports", vertical_packs=["hotel"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="tenant_hotel_imports")

    response = client.get(
        "/imports/external/hotel-plan",
        headers={"Authorization": f"Bearer {tenant_token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["adapter_id"] == "external-hotel-rent-mongo"
    assert payload["vertical_pack"] == "hotel"
    assert payload["entity_count"] > 0


if __name__ == "__main__":
    raise SystemExit(run_current_test_file(__file__))
