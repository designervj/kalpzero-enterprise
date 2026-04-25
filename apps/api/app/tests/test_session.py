from pathlib import Path
import sys

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.tests._direct import ensure_project_python, run_current_test_file

ensure_project_python(__file__, is_main=__name__ == "__main__")

from app.core.config import Settings
from app.db.mongo import build_runtime_database_name
from app.db.session import _normalize_database_url


def test_normalize_database_url_uses_psycopg_for_plain_postgres_urls() -> None:
    assert _normalize_database_url("postgresql://user:pass@localhost:5432/kalp") == (
        "postgresql+psycopg://user:pass@localhost:5432/kalp"
    )
    assert _normalize_database_url("postgres://user:pass@localhost:5432/kalp") == (
        "postgresql+psycopg://user:pass@localhost:5432/kalp"
    )


def test_normalize_database_url_preserves_existing_drivers() -> None:
    assert _normalize_database_url("postgresql+psycopg://user:pass@localhost:5432/kalp") == (
        "postgresql+psycopg://user:pass@localhost:5432/kalp"
    )
    assert _normalize_database_url("sqlite:///./dev.db") == "sqlite:///./dev.db"


def test_build_runtime_database_name_normalizes_tenant_slug() -> None:
    settings = Settings(
        KALPZERO_ENV="test",
        KALPZERO_APP_NAME="KalpZero Enterprise API Test",
        KALPZERO_REGION="in",
        KALPZERO_JWT_SECRET="test-secret-value-with-32-characters!!",
        KALPZERO_ENCRYPTION_KEY="test-encryption-key-with-32-chars!",
        KALPZERO_CONTROL_DATABASE_URL="sqlite:///./kalp.db",
        KALPZERO_RUNTIME_MONGO_URL="mongodb://localhost:27017/test",
        KALPZERO_RUNTIME_DOC_STORE_MODE="memory",
        KALPZERO_RUNTIME_MONGO_DB="KalpZero Runtime",
        KALPZERO_AI_MONGO_DB="kalpzero_ai_test",
        KALPZERO_OPS_REDIS_URL="redis://localhost:6379/0",
        KALPZERO_PUBLIC_WEB_URL="http://localhost:3000",
        KALPZERO_PUBLIC_API_URL="http://localhost:8000",
    )

    assert build_runtime_database_name(settings, tenant_slug="Tenant Demo / Prime") == "kp_tenant_demo_prime"


if __name__ == "__main__":
    raise SystemExit(run_current_test_file(__file__))
