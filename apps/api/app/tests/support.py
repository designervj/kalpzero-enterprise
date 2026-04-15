from fastapi.testclient import TestClient


def login(client: TestClient, *, email: str, tenant_slug: str | None = None) -> str:
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "very-secure-password",
            "tenant_slug": tenant_slug,
        },
    )
    return response.json()["access_token"]


def provision_tenant(
    client: TestClient,
    *,
    tenant_slug: str,
    vertical_packs: list[str],
    infra_mode: str = "dedicated",
    feature_flags: list[str] | None = None,
    agency_slug: str = "kalpzero-agency",
    bypass_onboarding_gate: bool = False,
) -> None:
    if len(vertical_packs) != 1:
        raise AssertionError("Tenant onboarding now expects exactly one vertical pack.")
    vertical_pack = vertical_packs[0]

    if bypass_onboarding_gate:
        from app.core.config import get_settings
        from app.db.mongo import get_runtime_document_store, provision_runtime_document_store_for_tenant
        from app.db.session import get_session_factory
        from app.repositories import platform as platform_repository
        from app.services import publishing as publishing_service

        settings = get_settings()
        session_factory = get_session_factory(settings.database_url)
        session = session_factory()
        try:
            agency = platform_repository.get_agency_by_slug(session, agency_slug)
            if agency is None:
                agency = platform_repository.create_agency(
                    session,
                    slug=agency_slug,
                    name="KalpZero Agency",
                    region="in",
                    owner_user_id="founder@kalpzero.com",
                )

            tenant = platform_repository.get_tenant_by_slug(session, tenant_slug)
            if tenant is None:
                tenant = platform_repository.create_tenant(
                    session,
                    agency_id=agency.id,
                    slug=tenant_slug,
                    display_name="Tenant Demo",
                    infra_mode=infra_mode,
                    vertical_pack=vertical_pack,
                    feature_flags=feature_flags or ["custom-domain"],
                    dedicated_profile_id="dedicated-infra-demo" if infra_mode == "dedicated" else None,
                )
            provision_runtime_document_store_for_tenant(settings, tenant_slug=tenant.slug)
            publishing_service.bootstrap_tenant_runtime_documents(get_runtime_document_store(settings), tenant)
            session.commit()
            return
        finally:
            session.close()

    platform_token = login(client, email="founder@kalpzero.com")
    agency_response = client.post(
        "/platform/agencies",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "slug": agency_slug,
            "name": "KalpZero Agency",
            "region": "in",
            "owner_user_id": "founder@kalpzero.com",
        },
    )
    if agency_response.status_code not in (201, 409):
        raise AssertionError(agency_response.text)

    tenant_response = client.post(
        "/platform/tenants",
        headers={"Authorization": f"Bearer {platform_token}"},
        json={
            "agency_slug": agency_slug,
            "slug": tenant_slug,
            "display_name": "Tenant Demo",
            "infra_mode": infra_mode,
            "vertical_pack": vertical_pack,
            "feature_flags": feature_flags or ["custom-domain"],
            "dedicated_profile_id": "dedicated-infra-demo" if infra_mode == "dedicated" else None,
        },
    )
    if tenant_response.status_code not in (201, 409):
        raise AssertionError(tenant_response.text)
