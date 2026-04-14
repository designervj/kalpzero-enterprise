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
    assert response.json() == {
        "user_id": "founder@kalpzero.com",
        "tenant_id": "platform_control",
        "roles": ["platform_admin"],
    }


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
            "vertical_packs": ["commerce", "hotel"],
            "feature_flags": ["seo-suite"],
        },
    )
    assert tenant_response.status_code == 201
    tenant_payload = tenant_response.json()
    assert tenant_payload["runtime_documents"]["database"] == "kalpzero_runtime_test__tenant__enterprise_tenant"
    assert tenant_payload["runtime_documents"]["bootstrap"]["seeded_document_count"] >= 5

    response = client.get(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
    )
    assert response.status_code == 200
    tenants = response.json()["tenants"]
    assert len(tenants) == 1
    assert tenants[0]["runtime_documents"]["database"] == "kalpzero_runtime_test__tenant__enterprise_tenant"


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
            "vertical_packs": ["commerce", "hotel"],
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
            "vertical_packs": ["real_estate"],
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
            "vertical_packs": ["commerce"],
            "feature_flags": [],
        },
    )

    assert tenant_response.status_code == 400
    assert "dedicated_profile_id" in tenant_response.json()["detail"]


def test_registry_returns_pack_driven_payload_with_valid_token(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="tenant_demo", vertical_packs=["commerce", "hotel"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="tenant_demo")

    response = client.get("/platform/registry", headers={"Authorization": f"Bearer {tenant_token}"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["tenant_id"] == "tenant_demo"
    assert "commerce.catalog" in payload["modules"]
    assert "commerce.inventory" in payload["modules"]
    assert "commerce.finance" in payload["modules"]
    assert "commerce.fulfillment" in payload["modules"]
    assert "hotel.reservations" in payload["modules"]
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
            "vertical_packs": ["commerce", "hotel"],
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
    assert {page["page_slug"] for page in pages_response.json()["pages"]} >= {"home", "about", "contact", "catalog", "stay"}


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
