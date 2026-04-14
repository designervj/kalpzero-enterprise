from fastapi.testclient import TestClient

from app.tests.support import login, provision_tenant


def test_publishing_blueprint_and_public_site_payload_flow(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="designable", vertical_packs=["commerce", "hotel"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="designable")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    blueprint_response = client.get("/publishing/blueprint", headers=headers)
    assert blueprint_response.status_code == 200
    assert blueprint_response.json()["business_label"] == "Tenant Demo"
    assert blueprint_response.json()["public_theme"]["brand_name"] == "Tenant Demo"

    update_response = client.put(
        "/publishing/blueprint",
        headers=headers,
        json={
            "business_label": "Designable Commerce Hotel",
            "public_theme": {
                "brand_name": "Designable Front",
                "primary_color": "#143d7a",
                "accent_color": "#d65d0e",
                "surface_color": "#f7f6f2",
                "ink_color": "#16202d",
                "muted_color": "#6c7481",
                "heading_font": "Fraunces",
                "body_font": "Space Grotesk",
                "radius_scale": "rounded",
                "density": "comfortable",
                "motion_profile": "lively",
            },
            "admin_theme": {
                "brand_name": "Designable Admin",
                "primary_color": "#16202d",
                "accent_color": "#143d7a",
                "surface_color": "#f3f5f8",
                "ink_color": "#16202d",
                "muted_color": "#6c7481",
                "heading_font": "Space Grotesk",
                "body_font": "Space Grotesk",
                "radius_scale": "soft",
                "density": "compact",
                "motion_profile": "minimal",
            },
            "public_navigation": [
                {"label": "Home", "href": "/", "kind": "link", "icon": "home"},
                {"label": "Stay", "href": "/stay", "kind": "link", "icon": "key"},
                {"label": "Book", "href": "/contact", "kind": "cta", "icon": "spark"},
            ],
            "admin_navigation": [
                {"label": "Overview", "href": "/admin", "kind": "module", "icon": "dashboard"},
                {"label": "Rooms", "href": "/admin/hotel", "kind": "module", "icon": "stack"},
            ],
            "routes": [
                {"key": "home", "path": "/", "page_slug": "home", "visibility": "public"},
                {"key": "stay", "path": "/stay", "page_slug": "stay", "visibility": "public"},
            ],
            "dashboard_widgets": [
                {
                    "key": "occupancy",
                    "title": "Occupancy",
                    "metric": "81%",
                    "description": "Track room utilization across properties.",
                }
            ],
            "vocabulary": {"customer": "Guest", "order": "Order", "booking": "Reservation"},
            "enabled_modules": ["publishing.pages", "hotel"],
            "mobile_capabilities": ["push_notifications", "digital_checkin"],
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["version"] == 2
    assert update_response.json()["public_theme"]["primary_color"] == "#143d7a"

    page_response = client.put(
        "/publishing/pages/home",
        headers=headers,
        json={
            "title": "Designable Front Home",
            "status": "live",
            "seo_title": "Designable Front",
            "seo_description": "Blueprint-driven homepage.",
            "route_path": "/",
            "layout": "landing",
            "blocks": [
                {
                    "id": "hero-1",
                    "kind": "hero",
                    "eyebrow": "Designable Front",
                    "headline": "A tenant site rendered from blueprint rules.",
                    "body": "Theme and navigation now come from runtime documents.",
                    "cta_label": "Explore Stay",
                    "cta_href": "/stay",
                    "items": [],
                }
            ],
        },
    )
    assert page_response.status_code == 200
    assert page_response.json()["status"] == "live"

    discovery_response = client.put(
        "/publishing/discovery",
        headers=headers,
        json={
            "headline": "Designable properties and commerce experiences",
            "summary": "Discovery is materialized from runtime docs.",
            "tags": ["commerce", "hotel"],
            "cards": [
                {
                    "title": "Stay Collection",
                    "summary": "Hospitality pages for direct booking.",
                    "href": "/stay",
                    "tags": ["hotel"],
                }
            ],
        },
    )
    assert discovery_response.status_code == 200
    assert len(discovery_response.json()["cards"]) == 1

    public_response = client.get("/publishing/public/designable/site?page_slug=home")
    assert public_response.status_code == 200
    payload = public_response.json()
    assert payload["public_theme"]["brand_name"] == "Designable Front"
    assert payload["page"]["title"] == "Designable Front Home"
    assert payload["discovery"]["headline"] == "Designable properties and commerce experiences"

    outbox_response = client.get("/platform/outbox", headers=headers)
    assert outbox_response.status_code == 200
    assert any(event["event_name"] == "publishing.content.published" for event in outbox_response.json()["events"])


def test_publishing_materializes_live_travel_packages(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="travelable", vertical_packs=["travel"], bypass_onboarding_gate=True)
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="travelable")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    package_response = client.post(
        "/travel/packages",
        headers=headers,
        json={
            "code": "KER-LUX-01",
            "slug": "kerala-luxe",
            "title": "Kerala Luxe",
            "summary": "Backwaters, wellness, and curated stays.",
            "origin_city": "Mumbai",
            "destination_city": "Kochi",
            "destination_country": "India",
            "duration_days": 5,
            "base_price_minor": 6299000,
            "currency": "INR",
            "status": "active",
            "itinerary_days": [
                {
                    "day_number": 1,
                    "title": "Arrival in Kochi",
                    "summary": "Meet, transfer, and waterfront check-in.",
                    "hotel_ref_id": "hotel_kochi_01",
                    "activity_ref_ids": [],
                    "transfer_ref_ids": ["transfer_arrival"],
                }
            ],
        },
    )
    assert package_response.status_code == 201

    departure_response = client.post(
        "/travel/departures",
        headers=headers,
        json={
            "package_id": package_response.json()["id"],
            "departure_date": "2026-06-02",
            "return_date": "2026-06-06",
            "seats_total": 12,
            "seats_available": 9,
            "price_override_minor": 6499000,
            "status": "scheduled",
        },
    )
    assert departure_response.status_code == 201

    public_response = client.get("/publishing/public/travelable/site?page_slug=packages")
    assert public_response.status_code == 200

    payload = public_response.json()
    feature_grid = next(block for block in payload["page"]["blocks"] if block["id"] == "travel-live-packages")
    assert any(item["title"] == "Kerala Luxe" for item in feature_grid["items"])
    assert any(card["title"] == "Kerala Luxe" for card in payload["discovery"]["cards"])


def test_publishing_materializes_live_commerce_catalog_and_product_detail(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="shoppable", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="shoppable")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Desk Setup",
            "slug": "desk-setup",
            "description": "Workspace products and accessories.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Monitor Stand",
            "slug": "kalpzero-monitor-stand",
            "description": "A catalog-driven product detail page.",
            "category_ids": [category_id],
            "seo_title": "KalpZero Monitor Stand",
            "seo_description": "Live commerce product page from the runtime.",
            "status": "active",
            "variants": [
                {
                    "sku": "MON-STD",
                    "label": "Standard",
                    "price_minor": 459900,
                    "currency": "INR",
                    "inventory_quantity": 6,
                },
                {
                    "sku": "MON-PRO",
                    "label": "Pro",
                    "price_minor": 559900,
                    "currency": "INR",
                    "inventory_quantity": 4,
                },
            ],
        },
    )
    assert product_response.status_code == 201

    catalog_response = client.get("/publishing/public/shoppable/site?page_slug=catalog")
    assert catalog_response.status_code == 200
    catalog_payload = catalog_response.json()

    category_block = next(block for block in catalog_payload["page"]["blocks"] if block["id"] == "commerce-live-categories")
    product_block = next(block for block in catalog_payload["page"]["blocks"] if block["id"] == "commerce-live-products")
    assert any(item["title"] == "Desk Setup" for item in category_block["items"])
    assert any(item["title"] == "KalpZero Monitor Stand" for item in product_block["items"])
    assert any(item["href"] == "/catalog/kalpzero-monitor-stand" for item in product_block["items"])
    assert any(card["title"] == "KalpZero Monitor Stand" for card in catalog_payload["discovery"]["cards"])

    detail_response = client.get("/publishing/public/shoppable/site?page_slug=catalog/kalpzero-monitor-stand")
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["page"]["title"] == "KalpZero Monitor Stand"
    assert detail_payload["page"]["seo_title"] == "KalpZero Monitor Stand"
    hero_block = next(block for block in detail_payload["page"]["blocks"] if block["id"] == "commerce-product-hero")
    variant_block = next(block for block in detail_payload["page"]["blocks"] if block["id"] == "commerce-product-variants")
    assert hero_block["headline"] == "KalpZero Monitor Stand"
    assert any(item["title"] == "Standard" for item in variant_block["items"])
    assert any(item["title"] == "Pro" for item in variant_block["items"])
