from fastapi.testclient import TestClient

from app.tests.support import login, provision_tenant


def test_commerce_pack_supports_catalog_and_order_flow(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_ops", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_ops")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Footwear",
            "slug": "footwear",
            "description": "Retail catalog for shoes.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Runner",
            "slug": "kalpzero-runner",
            "description": "Lightweight running shoe.",
            "category_ids": [category_id],
            "seo_title": "KalpZero Runner Shoe",
            "seo_description": "Performance footwear for daily runs.",
            "status": "active",
            "variants": [
                {
                    "sku": "RUN-42-BLK",
                    "label": "Black / 42",
                    "price_minor": 349900,
                    "currency": "INR",
                    "inventory_quantity": 12,
                }
            ],
        },
    )
    assert product_response.status_code == 201
    variant_id = product_response.json()["variants"][0]["id"]

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_900",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": variant_id, "quantity": 2}],
        },
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]
    assert order_response.json()["total_minor"] == 699800
    assert order_response.json()["inventory_reserved"] is True

    products_response = client.get("/commerce/products", headers=headers)
    overview_response = client.get("/commerce/overview", headers=headers)
    assert products_response.status_code == 200
    assert overview_response.status_code == 200
    assert products_response.json()["products"][0]["variants"][0]["inventory_quantity"] == 10
    assert overview_response.json()["orders"]["placed"] == 1

    cancel_response = client.patch(
        f"/commerce/orders/{order_id}/status",
        headers=headers,
        json={"status": "cancelled"},
    )
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "cancelled"

    refreshed_products = client.get("/commerce/products", headers=headers)
    assert refreshed_products.json()["products"][0]["variants"][0]["inventory_quantity"] == 12


def test_legacy_commerce_plan_endpoint_exposes_adapter(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_imports", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_imports")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    response = client.get("/imports/legacy/commerce-plan", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["adapter_id"] == "legacy-kalpzero-commerce"
    assert any(entity["canonical_entity"] == "commerce.product" for entity in payload["entities"])


def test_commerce_import_jobs_support_dry_run_execute_and_idempotent_replay(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_import_runtime", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_import_runtime")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    source_response = client.post(
        "/imports/sources",
        headers=headers,
        json={
            "name": "Legacy Commerce Fixture",
            "source_type": "legacy-kalpzero-commerce",
            "connection_profile_key": "inline-fixture",
            "vertical_pack": "commerce",
            "config": {
                "adapter_id": "legacy-kalpzero-commerce",
                "dataset": {
                    "categories": [
                        {"name": "Footwear", "slug": "footwear", "description": "Primary category"},
                        {"name": "Sneakers", "slug": "sneakers", "parent_slug": "footwear"},
                    ],
                    "brands": [
                        {"name": "Kalp Athletics", "slug": "kalp-athletics", "code": "KALP"},
                    ],
                    "vendors": [
                        {
                            "name": "Prime Supply Co",
                            "slug": "prime-supply",
                            "code": "SUP-001",
                            "contact_email": "supply@example.com",
                        }
                    ],
                    "collections": [
                        {"name": "Summer Launch", "slug": "summer-launch", "sort_order": 1},
                    ],
                    "warehouses": [
                        {
                            "name": "Central Warehouse",
                            "slug": "central-warehouse",
                            "code": "DEL-CWH",
                            "city": "Delhi",
                            "country": "India",
                            "is_default": True,
                        }
                    ],
                    "tax_profiles": [
                        {
                            "name": "GST 18",
                            "code": "GST18",
                            "prices_include_tax": False,
                            "rules": [{"label": "GST", "rate_basis_points": 1800}],
                        }
                    ],

                    "attribute_sets": [
                        {
                            "name": "Footwear Core",
                            "slug": "footwear-core",
                            "attribute_codes": [],
                        }
                    ],
                    "products": [
                        {
                            "name": "KalpZero Runner",
                            "slug": "kalpzero-runner",
                            "description": "Everyday performance sneaker.",
                            "brand_slug": "kalp-athletics",
                            "vendor_slug": "prime-supply",
                            "collection_slugs": ["summer-launch"],
                            "attribute_set_slug": None,
                            "category_slugs": ["sneakers"],
                            "seo_title": "KalpZero Runner",
                            "seo_description": "Imported commerce product.",
                            "product_attributes": [],
                            "variants": [
                                {
                                    "sku": "RUN-42-BLK",
                                    "label": "Black / 42",
                                    "price_minor": 349900,
                                    "currency": "INR",
                                    "inventory_quantity": 12,
                                    "attribute_values": [],
                                    "warehouse_stock": [
                                        {
                                            "warehouse_slug": "central-warehouse",
                                            "on_hand_quantity": 12,
                                            "low_stock_threshold": 3,
                                        }
                                    ],
                                },
                                {
                                    "sku": "RUN-43-WHT",
                                    "label": "White / 43",
                                    "price_minor": 359900,
                                    "currency": "INR",
                                    "inventory_quantity": 8,
                                    "attribute_values": [],
                                    "warehouse_stock": [
                                        {
                                            "warehouse_slug": "central-warehouse",
                                            "on_hand_quantity": 8,
                                            "low_stock_threshold": 2,
                                        }
                                    ],
                                },
                            ],
                        }
                    ],
                    "price_lists": [
                        {
                            "name": "Retail Default",
                            "slug": "retail-default",
                            "currency": "INR",
                            "items": [
                                {"variant_sku": "RUN-42-BLK", "price_minor": 339900},
                                {"variant_sku": "RUN-43-WHT", "price_minor": 349900},
                            ],
                        }
                    ],
                    "coupons": [
                        {
                            "code": "WELCOME10",
                            "discount_type": "percent",
                            "discount_value": 1000,
                            "minimum_subtotal_minor": 200000,
                            "applicable_category_slugs": ["sneakers"],
                            "applicable_variant_skus": ["RUN-42-BLK"],
                        }
                    ],
                },
            },
        },
    )
    assert source_response.status_code == 201
    source_id = source_response.json()["id"]

    dry_run_response = client.post(
        "/imports/jobs",
        headers=headers,
        json={"source_id": source_id, "mode": "dry_run"},
    )
    assert dry_run_response.status_code == 201
    dry_job = dry_run_response.json()["job"]
    assert dry_job["status"] == "completed"
    assert dry_job["report"]["stage"] == "dry_run_complete"
    assert dry_job["report"]["totals"]["create_candidates"] >= 10
    assert dry_job["report"]["totals"]["created"] == 0
    assert dry_run_response.json()["result_outbox_event"]["event_name"] == "import.job.completed"

    execute_response = client.post(
        "/imports/jobs",
        headers=headers,
        json={"source_id": source_id, "mode": "execute"},
    )
    assert execute_response.status_code == 201
    execute_job = execute_response.json()["job"]
    assert execute_job["status"] == "completed"
    assert execute_job["report"]["stage"] == "execute_complete"
    assert execute_job["report"]["totals"]["created"] >= 10

    overview_response = client.get("/commerce/overview", headers=headers)
    categories_response = client.get("/commerce/categories", headers=headers)
    products_response = client.get("/commerce/products", headers=headers)
    warehouses_response = client.get("/commerce/warehouses", headers=headers)
    stock_levels_response = client.get("/commerce/stock-levels", headers=headers)
    price_lists_response = client.get("/commerce/price-lists", headers=headers)
    coupons_response = client.get("/commerce/coupons", headers=headers)

    assert overview_response.status_code == 200
    assert categories_response.status_code == 200
    assert products_response.status_code == 200
    assert warehouses_response.status_code == 200
    assert stock_levels_response.status_code == 200
    assert price_lists_response.status_code == 200
    assert coupons_response.status_code == 200
    assert overview_response.json()["categories"] == 2
    assert overview_response.json()["products"] == 1
    assert overview_response.json()["price_lists"] == 1
    assert overview_response.json()["coupons"] == 1
    assert categories_response.json()["categories"][0]["slug"] in {"footwear", "sneakers"}
    assert products_response.json()["products"][0]["variants"][0]["sku"] in {"RUN-42-BLK", "RUN-43-WHT"}
    assert warehouses_response.json()["warehouses"][0]["slug"] == "central-warehouse"
    assert len(stock_levels_response.json()["stock_levels"]) == 2
    assert price_lists_response.json()["price_lists"][0]["slug"] == "retail-default"
    assert coupons_response.json()["coupons"][0]["code"] == "WELCOME10"

    replay_response = client.post(
        "/imports/jobs",
        headers=headers,
        json={"source_id": source_id, "mode": "execute"},
    )
    assert replay_response.status_code == 201
    replay_job = replay_response.json()["job"]
    assert replay_job["status"] == "completed"
    assert replay_job["report"]["totals"]["created"] == 0
    assert replay_job["report"]["totals"]["create_candidates"] == 0
    assert replay_job["report"]["totals"]["skipped_existing"] >= 10





def test_commerce_pack_supports_brands_vendors_collections_and_product_linkage(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_governance", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_governance")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Home Decor",
            "slug": "home-decor",
            "description": "Decor and curated home catalog.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    brand_response = client.post(
        "/commerce/brands",
        headers=headers,
        json={
            "name": "Kalp Living",
            "slug": "kalp-living",
            "code": "kalp-living",
            "description": "House brand for premium decor.",
        },
    )
    assert brand_response.status_code == 201
    brand_id = brand_response.json()["id"]

    vendor_response = client.post(
        "/commerce/vendors",
        headers=headers,
        json={
            "name": "Aster Crafts",
            "slug": "aster-crafts",
            "code": "aster-crafts",
            "description": "Regional manufacturing partner.",
            "contact_name": "Riya Sethi",
            "contact_email": "riya@astercrafts.example",
            "contact_phone": "+919999900001",
        },
    )
    assert vendor_response.status_code == 201
    vendor_id = vendor_response.json()["id"]

    collection_response = client.post(
        "/commerce/collections",
        headers=headers,
        json={
            "name": "Festive Edit",
            "slug": "festive-edit",
            "description": "Seasonal merchandising collection.",
            "sort_order": 10,
        },
    )
    assert collection_response.status_code == 201
    collection_id = collection_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "Brass Lantern",
            "slug": "brass-lantern",
            "description": "Statement lantern for festive spaces.",
            "brand_id": brand_id,
            "vendor_id": vendor_id,
            "collection_ids": [collection_id],
            "category_ids": [category_id],
            "seo_title": "Brass Lantern Decor",
            "seo_description": "Merchant-ready decor product with governance links.",
            "status": "active",
            "variants": [
                {
                    "sku": "LANTERN-STD",
                    "label": "Standard",
                    "price_minor": 459900,
                    "currency": "INR",
                    "inventory_quantity": 4,
                }
            ],
        },
    )

    assert product_response.status_code == 201
    payload = product_response.json()
    assert payload["brand_id"] == brand_id
    assert payload["vendor_id"] == vendor_id
    assert payload["collection_ids"] == [collection_id]

    overview_response = client.get("/commerce/overview", headers=headers)
    brands_response = client.get("/commerce/brands", headers=headers)
    vendors_response = client.get("/commerce/vendors", headers=headers)
    collections_response = client.get("/commerce/collections", headers=headers)
    products_response = client.get("/commerce/products", headers=headers)

    assert overview_response.status_code == 200
    assert brands_response.status_code == 200
    assert vendors_response.status_code == 200
    assert collections_response.status_code == 200
    assert products_response.status_code == 200
    assert overview_response.json()["brands"] == 1
    assert overview_response.json()["vendors"] == 1
    assert overview_response.json()["collections"] == 1
    assert products_response.json()["products"][0]["brand_id"] == brand_id
    assert products_response.json()["products"][0]["vendor_id"] == vendor_id
    assert products_response.json()["products"][0]["collection_ids"] == [collection_id]


def test_commerce_pack_supports_price_lists_coupons_and_tax_profiles(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_pricing", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_pricing")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Electronics",
            "slug": "electronics",
            "description": "Retail electronics catalog.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Speaker",
            "slug": "kalpzero-speaker",
            "description": "Portable speaker for pricing tests.",
            "category_ids": [category_id],
            "status": "active",
            "variants": [
                {
                    "sku": "SPK-STD",
                    "label": "Standard",
                    "price_minor": 10000,
                    "currency": "INR",
                    "inventory_quantity": 10,
                }
            ],
        },
    )
    assert product_response.status_code == 201
    variant_id = product_response.json()["variants"][0]["id"]

    tax_profile_response = client.post(
        "/commerce/tax-profiles",
        headers=headers,
        json={
            "name": "GST 18",
            "code": "gst-18",
            "description": "Standard GST rate.",
            "prices_include_tax": False,
            "rules": [
                {"label": "CGST", "rate_basis_points": 900},
                {"label": "SGST", "rate_basis_points": 900},
            ],
        },
    )
    assert tax_profile_response.status_code == 201
    tax_profile_id = tax_profile_response.json()["id"]

    price_list_response = client.post(
        "/commerce/price-lists",
        headers=headers,
        json={
            "name": "B2B Wholesale",
            "slug": "b2b-wholesale",
            "currency": "INR",
            "customer_segment": "b2b",
            "description": "Segment pricing for trade accounts.",
            "items": [{"variant_id": variant_id, "price_minor": 8000}],
        },
    )
    assert price_list_response.status_code == 201
    price_list_id = price_list_response.json()["id"]
    assert price_list_response.json()["items"][0]["price_minor"] == 8000

    coupon_response = client.post(
        "/commerce/coupons",
        headers=headers,
        json={
            "code": "WELCOME10",
            "description": "Ten percent launch discount.",
            "discount_type": "percent",
            "discount_value": 1000,
            "minimum_subtotal_minor": 10000,
            "maximum_discount_minor": 2000,
            "applicable_category_ids": [category_id],
        },
    )
    assert coupon_response.status_code == 201
    assert coupon_response.json()["code"] == "WELCOME10"

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_pricing_01",
            "price_list_id": price_list_id,
            "tax_profile_id": tax_profile_id,
            "coupon_code": "welcome10",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": variant_id, "quantity": 2}],
        },
    )
    assert order_response.status_code == 201
    payload = order_response.json()
    assert payload["subtotal_minor"] == 16000
    assert payload["discount_minor"] == 1600
    assert payload["tax_minor"] == 2592
    assert payload["total_minor"] == 16992
    assert payload["coupon_code"] == "WELCOME10"
    assert payload["price_list_id"] == price_list_id
    assert payload["tax_profile_id"] == tax_profile_id
    assert payload["lines"][0]["unit_price_minor"] == 8000
    assert payload["inventory_reserved"] is True

    overview_response = client.get("/commerce/overview", headers=headers)
    tax_profiles_response = client.get("/commerce/tax-profiles", headers=headers)
    price_lists_response = client.get("/commerce/price-lists", headers=headers)
    coupons_response = client.get("/commerce/coupons", headers=headers)

    assert overview_response.status_code == 200
    assert tax_profiles_response.status_code == 200
    assert price_lists_response.status_code == 200
    assert coupons_response.status_code == 200
    assert overview_response.json()["tax_profiles"] == 1
    assert overview_response.json()["price_lists"] == 1
    assert overview_response.json()["coupons"] == 1
    assert price_lists_response.json()["price_lists"][0]["items"][0]["variant_id"] == variant_id


def test_commerce_pack_supports_payment_refund_invoice_and_finance_detail(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_finance", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_finance")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Accessories",
            "slug": "accessories-finance",
            "description": "Commerce finance test catalog.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Travel Bag",
            "slug": "kalpzero-travel-bag",
            "description": "Soft goods used for finance flow tests.",
            "category_ids": [category_id],
            "status": "active",
            "variants": [
                {
                    "sku": "BAG-STD",
                    "label": "Standard",
                    "price_minor": 20000,
                    "currency": "INR",
                    "inventory_quantity": 6,
                }
            ],
        },
    )
    assert product_response.status_code == 201
    variant_id = product_response.json()["variants"][0]["id"]

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_finance_01",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": variant_id, "quantity": 1}],
        },
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]
    assert order_response.json()["payment_status"] == "pending"
    assert order_response.json()["balance_minor"] == 20000

    authorized_payment_response = client.post(
        f"/commerce/orders/{order_id}/payments",
        headers=headers,
        json={
            "amount_minor": 20000,
            "provider": "razorpay",
            "payment_method": "card",
            "status": "authorized",
            "reference": "auth_001",
        },
    )
    assert authorized_payment_response.status_code == 201
    assert authorized_payment_response.json()["payment_status"] == "authorized"
    assert authorized_payment_response.json()["paid_minor"] == 0
    assert authorized_payment_response.json()["balance_minor"] == 20000

    captured_payment_response = client.post(
        f"/commerce/orders/{order_id}/payments",
        headers=headers,
        json={
            "amount_minor": 20000,
            "provider": "razorpay",
            "payment_method": "card",
            "status": "captured",
            "reference": "cap_001",
        },
    )
    assert captured_payment_response.status_code == 201
    payload = captured_payment_response.json()
    assert payload["payment_status"] == "paid"
    assert payload["status"] == "paid"
    assert payload["paid_minor"] == 20000
    assert payload["balance_minor"] == 0
    captured_payment = next(payment for payment in payload["payments"] if payment["status"] == "captured")

    invoice_response = client.post(f"/commerce/orders/{order_id}/issue-invoice", headers=headers)
    assert invoice_response.status_code == 200
    assert invoice_response.json()["invoice_number"].startswith("INV-")
    assert invoice_response.json()["invoice_issued_at"] is not None
    assert len(invoice_response.json()["invoices"]) == 1

    refund_response = client.post(
        f"/commerce/orders/{order_id}/refunds",
        headers=headers,
        json={
            "payment_id": captured_payment["id"],
            "amount_minor": 3000,
            "reason": "Damaged shipment compensation",
            "reference": "refund_001",
        },
    )
    assert refund_response.status_code == 201
    assert refund_response.json()["payment_status"] == "partially_refunded"
    assert refund_response.json()["paid_minor"] == 20000
    assert refund_response.json()["refunded_minor"] == 3000
    assert refund_response.json()["balance_minor"] == 0
    assert len(refund_response.json()["refunds"]) == 1

    finance_detail_response = client.get(f"/commerce/orders/{order_id}/finance", headers=headers)
    payments_response = client.get("/commerce/payments", headers=headers)
    refunds_response = client.get("/commerce/refunds", headers=headers)
    invoices_response = client.get("/commerce/invoices", headers=headers)
    overview_response = client.get("/commerce/overview", headers=headers)

    assert finance_detail_response.status_code == 200
    assert payments_response.status_code == 200
    assert refunds_response.status_code == 200
    assert invoices_response.status_code == 200
    assert overview_response.status_code == 200
    assert len(finance_detail_response.json()["payments"]) == 2
    assert len(finance_detail_response.json()["refunds"]) == 1
    assert len(finance_detail_response.json()["invoices"]) == 1
    assert overview_response.json()["payments"] == 2
    assert overview_response.json()["refunds"] == 1
    assert overview_response.json()["invoices"] == 1
    assert overview_response.json()["order_payment_statuses"]["partially_refunded"] == 1


def test_commerce_pack_supports_settlement_reconciliation_flow(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_settlements", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_settlements")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Office",
            "slug": "office-settlements",
            "description": "Commerce settlement catalog.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Desk Mat",
            "slug": "kalpzero-desk-mat",
            "description": "Commerce settlement validation product.",
            "category_ids": [category_id],
            "status": "active",
            "variants": [
                {
                    "sku": "MAT-STD",
                    "label": "Standard",
                    "price_minor": 20000,
                    "currency": "INR",
                    "inventory_quantity": 4,
                }
            ],
        },
    )
    assert product_response.status_code == 201
    variant_id = product_response.json()["variants"][0]["id"]

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_settlement_01",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": variant_id, "quantity": 1}],
        },
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]

    payment_response = client.post(
        f"/commerce/orders/{order_id}/payments",
        headers=headers,
        json={
            "amount_minor": 20000,
            "provider": "razorpay",
            "payment_method": "card",
            "status": "captured",
            "reference": "cap_settlement_001",
        },
    )
    assert payment_response.status_code == 201
    captured_payment = next(payment for payment in payment_response.json()["payments"] if payment["status"] == "captured")

    refund_response = client.post(
        f"/commerce/orders/{order_id}/refunds",
        headers=headers,
        json={
            "payment_id": captured_payment["id"],
            "amount_minor": 3000,
            "reason": "Price adjustment",
            "reference": "refund_settlement_001",
        },
    )
    assert refund_response.status_code == 201
    refund_id = refund_response.json()["refunds"][0]["id"]

    settlement_response = client.post(
        "/commerce/settlements",
        headers=headers,
        json={
            "provider": "razorpay",
            "settlement_reference": "settl_001",
            "currency": "INR",
            "status": "reported",
            "payment_ids": [captured_payment["id"]],
            "refund_ids": [refund_id],
            "fees_minor": 500,
            "adjustments_minor": 200,
            "notes": "Daily payout batch",
        },
    )
    assert settlement_response.status_code == 201
    payload = settlement_response.json()
    settlement_id = payload["id"]
    assert payload["status"] == "reported"
    assert payload["payments_minor"] == 20000
    assert payload["refunds_minor"] == 3000
    assert payload["fees_minor"] == 500
    assert payload["adjustments_minor"] == 200
    assert payload["net_minor"] == 16700
    assert len(payload["entries"]) == 4

    settlements_response = client.get("/commerce/settlements", headers=headers)
    settlement_detail_response = client.get(f"/commerce/settlements/{settlement_id}", headers=headers)
    overview_response = client.get("/commerce/overview", headers=headers)
    assert settlements_response.status_code == 200
    assert settlement_detail_response.status_code == 200
    assert overview_response.status_code == 200
    assert settlements_response.json()["settlements"][0]["settlement_reference"] == "settl_001"
    assert overview_response.json()["settlements"]["reported"] == 1
    assert overview_response.json()["unreconciled_payments"] == 0
    assert overview_response.json()["unreconciled_refunds"] == 0

    reconciled_response = client.patch(
        f"/commerce/settlements/{settlement_id}/status",
        headers=headers,
        json={"status": "reconciled"},
    )
    assert reconciled_response.status_code == 200
    assert reconciled_response.json()["status"] == "reconciled"
    assert reconciled_response.json()["reconciled_at"] is not None

    closed_response = client.patch(
        f"/commerce/settlements/{settlement_id}/status",
        headers=headers,
        json={"status": "closed"},
    )
    assert closed_response.status_code == 200
    assert closed_response.json()["status"] == "closed"
    assert closed_response.json()["closed_at"] is not None


def test_commerce_settlement_validation_blocks_duplicate_payment_linkage(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_settlement_validation", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_settlement_validation")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Accessories",
            "slug": "accessories-settlement-validation",
            "description": "Settlement duplicate validation catalog.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Sleeve",
            "slug": "kalpzero-sleeve",
            "description": "Duplicate settlement validation product.",
            "category_ids": [category_id],
            "status": "active",
            "variants": [
                {
                    "sku": "SLV-STD",
                    "label": "Standard",
                    "price_minor": 12000,
                    "currency": "INR",
                    "inventory_quantity": 3,
                }
            ],
        },
    )
    assert product_response.status_code == 201
    variant_id = product_response.json()["variants"][0]["id"]

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_settlement_02",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": variant_id, "quantity": 1}],
        },
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]

    payment_response = client.post(
        f"/commerce/orders/{order_id}/payments",
        headers=headers,
        json={
            "amount_minor": 12000,
            "provider": "razorpay",
            "payment_method": "upi",
            "status": "captured",
            "reference": "cap_settlement_002",
        },
    )
    assert payment_response.status_code == 201
    captured_payment = next(payment for payment in payment_response.json()["payments"] if payment["status"] == "captured")

    first_settlement_response = client.post(
        "/commerce/settlements",
        headers=headers,
        json={
            "provider": "razorpay",
            "currency": "INR",
            "payment_ids": [captured_payment["id"]],
        },
    )
    assert first_settlement_response.status_code == 201

    duplicate_settlement_response = client.post(
        "/commerce/settlements",
        headers=headers,
        json={
            "provider": "razorpay",
            "currency": "INR",
            "payment_ids": [captured_payment["id"]],
        },
    )
    assert duplicate_settlement_response.status_code == 409
    assert "already linked to another settlement" in duplicate_settlement_response.json()["detail"]


def test_commerce_pack_supports_warehouse_stock_fulfillment_and_shipment_flow(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_ops_extended", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_ops_extended")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Electronics",
            "slug": "electronics",
            "description": "Devices and accessories.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Speaker",
            "slug": "kalpzero-speaker",
            "description": "Portable speaker for multi-channel commerce.",
            "category_ids": [category_id],
            "seo_title": "KalpZero Speaker",
            "seo_description": "Portable speaker inventory test.",
            "status": "active",
            "variants": [
                {
                    "sku": "SPK-BLK-01",
                    "label": "Black",
                    "price_minor": 899900,
                    "currency": "INR",
                    "inventory_quantity": 0,
                }
            ],
        },
    )
    assert product_response.status_code == 201
    variant_id = product_response.json()["variants"][0]["id"]

    warehouse_response = client.post(
        "/commerce/warehouses",
        headers=headers,
        json={
            "name": "Primary DC",
            "slug": "primary-dc",
            "code": "PDC",
            "city": "Jaipur",
            "country": "India",
            "status": "active",
            "is_default": True,
        },
    )
    assert warehouse_response.status_code == 201
    warehouse_id = warehouse_response.json()["id"]
    assert warehouse_response.json()["is_default"] is True

    stock_adjustment_response = client.post(
        f"/commerce/warehouses/{warehouse_id}/stock-adjustments",
        headers=headers,
        json={
            "variant_id": variant_id,
            "quantity_delta": 20,
            "notes": "Opening stock",
            "low_stock_threshold": 5,
        },
    )
    assert stock_adjustment_response.status_code == 201
    assert stock_adjustment_response.json()["on_hand_quantity"] == 20
    assert stock_adjustment_response.json()["available_quantity"] == 20

    products_response = client.get("/commerce/products", headers=headers)
    assert products_response.status_code == 200
    assert products_response.json()["products"][0]["variants"][0]["inventory_quantity"] == 20

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_ops_001",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": variant_id, "quantity": 3}],
        },
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]
    assert order_response.json()["inventory_reserved"] is True
    assert order_response.json()["lines"][0]["allocated_warehouse_id"] == warehouse_id
    assert order_response.json()["lines"][0]["fulfilled_quantity"] == 0

    stock_levels_after_order = client.get("/commerce/stock-levels", headers=headers)
    assert stock_levels_after_order.status_code == 200
    stock_level = stock_levels_after_order.json()["stock_levels"][0]
    assert stock_level["on_hand_quantity"] == 20
    assert stock_level["reserved_quantity"] == 3
    assert stock_level["available_quantity"] == 17

    fulfillment_response = client.post(
        f"/commerce/orders/{order_id}/fulfillments",
        headers=headers,
        json={
            "lines": [
                {
                    "order_line_id": order_response.json()["lines"][0]["id"],
                    "quantity": 3,
                }
            ]
        },
    )
    assert fulfillment_response.status_code == 201
    fulfillment_id = fulfillment_response.json()["id"]
    assert fulfillment_response.json()["status"] == "pending_pick"

    pack_response = client.patch(
        f"/commerce/fulfillments/{fulfillment_id}/status",
        headers=headers,
        json={"status": "packed"},
    )
    assert pack_response.status_code == 200
    assert pack_response.json()["status"] == "packed"
    assert pack_response.json()["packed_at"] is not None

    shipment_response = client.post(
        f"/commerce/fulfillments/{fulfillment_id}/shipments",
        headers=headers,
        json={
            "carrier": "Delhivery",
            "service_level": "express",
            "tracking_number": "trk-001",
            "metadata": {"awb": "AWB001"},
        },
    )
    assert shipment_response.status_code == 201
    shipment_id = shipment_response.json()["id"]
    assert shipment_response.json()["status"] == "shipped"

    stock_levels_after_shipment = client.get("/commerce/stock-levels", headers=headers)
    assert stock_levels_after_shipment.status_code == 200
    stock_level_after_shipment = stock_levels_after_shipment.json()["stock_levels"][0]
    assert stock_level_after_shipment["on_hand_quantity"] == 17
    assert stock_level_after_shipment["reserved_quantity"] == 0
    assert stock_level_after_shipment["available_quantity"] == 17

    order_after_shipment = client.get("/commerce/orders", headers=headers)
    assert order_after_shipment.status_code == 200
    assert order_after_shipment.json()["orders"][0]["lines"][0]["fulfilled_quantity"] == 3
    assert order_after_shipment.json()["orders"][0]["status"] == "fulfilled"

    deliver_response = client.patch(
        f"/commerce/shipments/{shipment_id}/status",
        headers=headers,
        json={"status": "delivered"},
    )
    assert deliver_response.status_code == 200
    assert deliver_response.json()["status"] == "delivered"
    assert deliver_response.json()["delivered_at"] is not None

    fulfillments_response = client.get("/commerce/fulfillments", headers=headers)
    shipments_response = client.get("/commerce/shipments", headers=headers)
    stock_ledger_response = client.get("/commerce/stock-ledger", headers=headers)
    overview_response = client.get("/commerce/overview", headers=headers)

    assert fulfillments_response.status_code == 200
    assert shipments_response.status_code == 200
    assert stock_ledger_response.status_code == 200
    assert overview_response.status_code == 200
    assert fulfillments_response.json()["fulfillments"][0]["status"] == "delivered"
    assert shipments_response.json()["shipments"][0]["status"] == "delivered"
    assert len(stock_ledger_response.json()["entries"]) == 3
    assert {entry["entry_type"] for entry in stock_ledger_response.json()["entries"]} == {
        "restock",
        "reservation",
        "fulfillment",
    }
    assert overview_response.json()["warehouses"] == 1
    assert overview_response.json()["stock_levels"] == 1
    assert overview_response.json()["fulfillments"]["delivered"] == 1
    assert overview_response.json()["shipments"]["delivered"] == 1


def test_commerce_pack_supports_returns_and_inventory_restock_on_receive(client: TestClient) -> None:
    provision_tenant(client, tenant_slug="commerce_returns", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_returns")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Lifestyle",
            "slug": "lifestyle-returns",
            "description": "Catalog for return handling tests.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Bottle",
            "slug": "kalpzero-bottle",
            "description": "Reusable bottle for post-fulfillment returns.",
            "category_ids": [category_id],
            "status": "active",
            "variants": [
                {
                    "sku": "BTL-STD",
                    "label": "Standard",
                    "price_minor": 15000,
                    "currency": "INR",
                    "inventory_quantity": 0,
                }
            ],
        },
    )
    assert product_response.status_code == 201
    variant_id = product_response.json()["variants"][0]["id"]

    warehouse_response = client.post(
        "/commerce/warehouses",
        headers=headers,
        json={
            "name": "Returns DC",
            "slug": "returns-dc",
            "code": "RDC",
            "city": "Delhi",
            "country": "India",
            "status": "active",
            "is_default": True,
        },
    )
    assert warehouse_response.status_code == 201
    warehouse_id = warehouse_response.json()["id"]

    stock_adjustment_response = client.post(
        f"/commerce/warehouses/{warehouse_id}/stock-adjustments",
        headers=headers,
        json={
            "variant_id": variant_id,
            "quantity_delta": 10,
            "notes": "Opening stock for returns test",
        },
    )
    assert stock_adjustment_response.status_code == 201

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_returns_01",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": variant_id, "quantity": 2}],
        },
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]
    order_line_id = order_response.json()["lines"][0]["id"]

    fulfillment_response = client.post(
        f"/commerce/orders/{order_id}/fulfillments",
        headers=headers,
        json={"lines": [{"order_line_id": order_line_id, "quantity": 2}]},
    )
    assert fulfillment_response.status_code == 201
    fulfillment_id = fulfillment_response.json()["id"]

    pack_response = client.patch(
        f"/commerce/fulfillments/{fulfillment_id}/status",
        headers=headers,
        json={"status": "packed"},
    )
    assert pack_response.status_code == 200

    shipment_response = client.post(
        f"/commerce/fulfillments/{fulfillment_id}/shipments",
        headers=headers,
        json={
            "carrier": "BlueDart",
            "service_level": "surface",
            "tracking_number": "ret-001",
            "metadata": {"bag": "A1"},
        },
    )
    assert shipment_response.status_code == 201
    shipment_id = shipment_response.json()["id"]

    delivered_response = client.patch(
        f"/commerce/shipments/{shipment_id}/status",
        headers=headers,
        json={"status": "delivered"},
    )
    assert delivered_response.status_code == 200

    return_response = client.post(
        f"/commerce/orders/{order_id}/returns",
        headers=headers,
        json={
            "reason_summary": "Customer requested a size change",
            "notes": "One unit came back sealed.",
            "lines": [
                {
                    "order_line_id": order_line_id,
                    "quantity": 1,
                    "resolution_type": "refund",
                    "restock_on_receive": True,
                }
            ],
        },
    )
    assert return_response.status_code == 201
    return_payload = return_response.json()
    return_id = return_payload["id"]
    assert return_payload["status"] == "requested"
    assert return_payload["lines"][0]["line_amount_minor"] == 15000

    approved_response = client.patch(
        f"/commerce/returns/{return_id}/status",
        headers=headers,
        json={"status": "approved"},
    )
    assert approved_response.status_code == 200
    assert approved_response.json()["status"] == "approved"

    received_response = client.patch(
        f"/commerce/returns/{return_id}/status",
        headers=headers,
        json={"status": "received"},
    )
    assert received_response.status_code == 200
    assert received_response.json()["status"] == "received"
    assert received_response.json()["inventory_restocked"] is True

    stock_levels_response = client.get("/commerce/stock-levels", headers=headers)
    assert stock_levels_response.status_code == 200
    stock_level = stock_levels_response.json()["stock_levels"][0]
    assert stock_level["on_hand_quantity"] == 9
    assert stock_level["available_quantity"] == 9

    completed_response = client.patch(
        f"/commerce/returns/{return_id}/status",
        headers=headers,
        json={"status": "completed"},
    )
    assert completed_response.status_code == 200
    assert completed_response.json()["status"] == "completed"
    assert completed_response.json()["closed_at"] is not None

    finance_detail_response = client.get(f"/commerce/orders/{order_id}/finance", headers=headers)
    returns_response = client.get("/commerce/returns", headers=headers)
    overview_response = client.get("/commerce/overview", headers=headers)

    assert finance_detail_response.status_code == 200
    assert returns_response.status_code == 200
    assert overview_response.status_code == 200
    assert len(finance_detail_response.json()["returns"]) == 1
    assert returns_response.json()["returns"][0]["return_number"].startswith("RET-")
    assert overview_response.json()["returns"]["completed"] == 1


def test_commerce_return_validation_blocks_quantity_beyond_delivered_and_supports_exchange_reference(
    client: TestClient,
) -> None:
    provision_tenant(client, tenant_slug="commerce_returns_validation", vertical_packs=["commerce"])
    tenant_token = login(client, email="ops@tenant.com", tenant_slug="commerce_returns_validation")
    headers = {"Authorization": f"Bearer {tenant_token}"}

    category_response = client.post(
        "/commerce/categories",
        headers=headers,
        json={
            "name": "Apparel",
            "slug": "apparel-returns",
            "description": "Return validation catalog.",
        },
    )
    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/commerce/products",
        headers=headers,
        json={
            "name": "KalpZero Tee",
            "slug": "kalpzero-tee",
            "description": "Exchange-ready product.",
            "category_ids": [category_id],
            "status": "active",
            "variants": [
                {
                    "sku": "TEE-M",
                    "label": "Medium",
                    "price_minor": 22000,
                    "currency": "INR",
                    "inventory_quantity": 0,
                },
                {
                    "sku": "TEE-L",
                    "label": "Large",
                    "price_minor": 22000,
                    "currency": "INR",
                    "inventory_quantity": 0,
                },
            ],
        },
    )
    assert product_response.status_code == 201
    source_variant_id = product_response.json()["variants"][0]["id"]
    replacement_variant_id = product_response.json()["variants"][1]["id"]

    warehouse_response = client.post(
        "/commerce/warehouses",
        headers=headers,
        json={
            "name": "Validation DC",
            "slug": "validation-dc",
            "code": "VDC",
            "city": "Mumbai",
            "country": "India",
            "status": "active",
            "is_default": True,
        },
    )
    assert warehouse_response.status_code == 201
    warehouse_id = warehouse_response.json()["id"]

    for variant_id in [source_variant_id, replacement_variant_id]:
        stock_adjustment_response = client.post(
            f"/commerce/warehouses/{warehouse_id}/stock-adjustments",
            headers=headers,
            json={
                "variant_id": variant_id,
                "quantity_delta": 5,
                "notes": "Opening stock for exchange validation",
            },
        )
        assert stock_adjustment_response.status_code == 201

    order_response = client.post(
        "/commerce/orders",
        headers=headers,
        json={
            "customer_id": "cust_returns_02",
            "status": "placed",
            "currency": "INR",
            "lines": [{"variant_id": source_variant_id, "quantity": 1}],
        },
    )
    assert order_response.status_code == 201
    order_id = order_response.json()["id"]
    order_line_id = order_response.json()["lines"][0]["id"]

    fulfillment_response = client.post(
        f"/commerce/orders/{order_id}/fulfillments",
        headers=headers,
        json={"lines": [{"order_line_id": order_line_id, "quantity": 1}]},
    )
    assert fulfillment_response.status_code == 201
    fulfillment_id = fulfillment_response.json()["id"]
    assert client.patch(
        f"/commerce/fulfillments/{fulfillment_id}/status",
        headers=headers,
        json={"status": "packed"},
    ).status_code == 200
    shipment_response = client.post(
        f"/commerce/fulfillments/{fulfillment_id}/shipments",
        headers=headers,
        json={
            "carrier": "Ecom Express",
            "service_level": "standard",
            "tracking_number": "ret-002",
            "metadata": {},
        },
    )
    assert shipment_response.status_code == 201
    shipment_id = shipment_response.json()["id"]
    assert client.patch(
        f"/commerce/shipments/{shipment_id}/status",
        headers=headers,
        json={"status": "delivered"},
    ).status_code == 200

    exchange_return_response = client.post(
        f"/commerce/orders/{order_id}/returns",
        headers=headers,
        json={
            "reason_summary": "Exchange medium for large",
            "lines": [
                {
                    "order_line_id": order_line_id,
                    "quantity": 1,
                    "resolution_type": "exchange",
                    "replacement_variant_id": replacement_variant_id,
                }
            ],
        },
    )
    assert exchange_return_response.status_code == 201
    assert exchange_return_response.json()["lines"][0]["resolution_type"] == "exchange"
    assert exchange_return_response.json()["lines"][0]["replacement_variant_id"] == replacement_variant_id

    invalid_return_response = client.post(
        f"/commerce/orders/{order_id}/returns",
        headers=headers,
        json={
            "reason_summary": "Attempt over-return",
            "lines": [
                {
                    "order_line_id": order_line_id,
                    "quantity": 2,
                    "resolution_type": "refund",
                }
            ],
        },
    )
    assert invalid_return_response.status_code == 409
    assert "delivered quantity available for return" in invalid_return_response.json()["detail"]
