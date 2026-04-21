#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"

if [[ ! -x "$API_DIR/.venv/bin/python" ]]; then
  echo "API virtualenv is missing at $API_DIR/.venv" >&2
  exit 1
fi

(
  cd "$API_DIR"
  ./.venv/bin/python - <<'PY'
from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import TenantModel, UserModel
from app.db.session import get_session_factory, init_db
from app.schemas.requests import RegisterRequest
from app.services.auth import create_user


PLATFORM_EMAIL = "founder@kalpzero.com"
PLATFORM_PASSWORD = "very-secure-password"
TENANT_EMAIL = "ops@tenant.com"
TENANT_PASSWORD = "very-secure-password"
TENANT_SLUG = "demo-tenant"


def ensure_user(db, *, email: str, password: str, name: str, tenant_slug: str | None = None) -> bool:
    existing = db.scalar(select(UserModel).where(UserModel.email == email))
    if existing is not None:
        print(f"bootstrap-demo-users: {email} already exists")
        return False

    create_user(
        db,
        RegisterRequest(
            email=email,
            password=password,
            tenant_slug=tenant_slug,
            name=name,
        ),
    )
    print(f"bootstrap-demo-users: created {email}")
    return True


def main() -> None:
    settings = get_settings()
    init_db(settings)
    session_factory = get_session_factory(settings.database_url)
    db = session_factory()
    try:
        ensure_user(
            db,
            email=PLATFORM_EMAIL,
            password=PLATFORM_PASSWORD,
            name="Platform Founder",
        )

        tenant = db.scalar(select(TenantModel).where(TenantModel.slug == TENANT_SLUG))
        if tenant is None:
            print(f"bootstrap-demo-users: tenant '{TENANT_SLUG}' not found, skipping tenant operator bootstrap")
            return

        ensure_user(
            db,
            email=TENANT_EMAIL,
            password=TENANT_PASSWORD,
            name="Tenant Operator",
            tenant_slug=TENANT_SLUG,
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
PY
)
