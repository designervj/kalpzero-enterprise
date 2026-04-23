import asyncio
import json
import os
from pathlib import Path

import fastapi.dependencies.utils
import fastapi.routing
import httpx
import pytest
import starlette.concurrency

from app.core.config import Settings, get_settings
from app.db.mongo import clear_mongo_cache
from app.db.redis import clear_redis_cache
from app.db.session import clear_db_caches, get_db_session, get_session_factory, init_db


async def _run_sync_inline(func, *args, **kwargs):
    return func(*args, **kwargs)


class ApiTestClient:
    def __init__(self, app) -> None:
        self.app = app
        self._runner = asyncio.Runner()
        self._client = self._runner.run(self._create_client())

    async def _create_client(self) -> httpx.AsyncClient:
        transport = httpx.ASGITransport(app=self.app)
        return httpx.AsyncClient(
            transport=transport,
            base_url="http://testserver",
            cookies=httpx.Cookies(),
        )

    async def _request_async(self, method: str, url: str, **kwargs) -> httpx.Response:
        response = await self._client.request(method, url, **kwargs)
        await response.aread()
        return response

    def request(self, method: str, url: str, *args, **kwargs) -> httpx.Response:
        return self._runner.run(self._request_async(method, url, **kwargs))

    def get(self, url: str, *args, **kwargs) -> httpx.Response:
        return self.request("GET", url, *args, **kwargs)

    def post(self, url: str, *args, **kwargs) -> httpx.Response:
        return self.request("POST", url, *args, **kwargs)

    def put(self, url: str, *args, **kwargs) -> httpx.Response:
        return self.request("PUT", url, *args, **kwargs)

    def patch(self, url: str, *args, **kwargs) -> httpx.Response:
        return self.request("PATCH", url, *args, **kwargs)

    def delete(self, url: str, *args, **kwargs) -> httpx.Response:
        return self.request("DELETE", url, *args, **kwargs)

    def close(self) -> None:
        self._runner.run(self._client.aclose())
        self._runner.close()


def _resolve_test_mongo_url() -> str:
    direct_env = os.environ.get("KALPZERO_RUNTIME_MONGO_URL") or os.environ.get("KALPZERO_MONGO_URL")
    if direct_env:
        return direct_env
    try:
        return Settings().runtime_mongo_url
    except Exception:
        return "mongodb://localhost:27017/test"


def _set_default_env(db_path: Path) -> None:
    os.environ["KALPZERO_ENV"] = "test"
    os.environ["KALPZERO_APP_NAME"] = "KalpZero Enterprise API Test"
    os.environ["KALPZERO_REGION"] = "in"
    os.environ["KALPZERO_JWT_SECRET"] = "test-secret-value-with-32-characters!!"
    os.environ["KALPZERO_ENCRYPTION_KEY"] = "test-encryption-key-with-32-chars!"
    os.environ["KALPZERO_CONTROL_DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ["KALPZERO_RUNTIME_MONGO_URL"] = _resolve_test_mongo_url()
    os.environ["KALPZERO_RUNTIME_DOC_STORE_MODE"] = "mongo"
    os.environ["KALPZERO_RUNTIME_MONGO_DB"] = "kalpzero_runtime_test"
    os.environ["KALPZERO_AI_MONGO_DB"] = "kalpzero_ai_test"
    os.environ["KALPZERO_OPS_REDIS_URL"] = "redis://localhost:6379/0"
    os.environ["KALPZERO_PUBLIC_WEB_URL"] = "http://localhost:3000"
    os.environ["KALPZERO_PUBLIC_API_URL"] = "http://localhost:8000"
    # Override repo-root automation secrets so tests stay hermetic unless a
    # specific test opts back in with monkeypatch.
    os.environ["KALPZERO_GITHUB_TOKEN"] = ""
    os.environ["KALPZERO_GITHUB_REPO_OWNER"] = ""
    os.environ["KALPZERO_GITHUB_TEMPLATE_OWNER"] = ""
    os.environ["KALPZERO_GITHUB_TEMPLATE_REPO"] = ""
    os.environ["KALPZERO_GITHUB_REPO_PREFIX"] = "kalp-biz"
    os.environ["KALPZERO_GITHUB_DEFAULT_BRANCH"] = "main"
    os.environ["KALPZERO_WEBSITE_REPO_PRIVATE"] = "true"
    os.environ["KALPZERO_VERCEL_TOKEN"] = ""
    os.environ["KALPZERO_VERCEL_TEAM_ID"] = ""
    os.environ["KALPZERO_VERCEL_TEAM_SLUG"] = ""
    os.environ["KALPZERO_VERCEL_PROJECT_PREFIX"] = "kalp-biz"
    os.environ["KALPZERO_VERCEL_ROOT_DIRECTORY"] = ""
    os.environ["KALPZERO_VERCEL_INSTALL_COMMAND"] = ""
    os.environ["KALPZERO_VERCEL_BUILD_COMMAND"] = ""
    os.environ["KALPZERO_VERCEL_OUTPUT_DIRECTORY"] = ""


def _redact_headers(headers: dict[str, object] | None) -> dict[str, object]:
    if not headers:
        return {}

    redacted: dict[str, object] = {}
    for key, value in headers.items():
        if key.lower() == "authorization" and isinstance(value, str) and len(value) > 20:
            redacted[key] = f"{value[:16]}..."
        else:
            redacted[key] = value
    return redacted


def _attach_verbose_http_logging(test_client: ApiTestClient) -> None:
    if os.environ.get("KALPZERO_TEST_VERBOSE_HTTP") != "1":
        return

    original_request = test_client.request

    def verbose_request(method: str, url: str, *args, **kwargs):
        print(f"\n>>> {method.upper()} {url}")
        if kwargs.get("params"):
            print("params:", json.dumps(kwargs["params"], indent=2, default=str))
        if kwargs.get("headers"):
            print("headers:", json.dumps(_redact_headers(kwargs["headers"]), indent=2, default=str))
        if "json" in kwargs and kwargs["json"] is not None:
            print("json:", json.dumps(kwargs["json"], indent=2, default=str))

        response = original_request(method, url, *args, **kwargs)

        print(f"<<< {response.status_code} {url}")
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                print(json.dumps(response.json(), indent=2, default=str))
            except ValueError:
                print(response.text)
        else:
            body = response.text
            if len(body) > 1200:
                body = f"{body[:1200]}... [truncated]"
            print(body)

        return response

    test_client.request = verbose_request  # type: ignore[method-assign]


@pytest.fixture
def client(tmp_path: Path) -> ApiTestClient:
    db_path = tmp_path / "kalpzero-enterprise-test.db"
    _set_default_env(db_path)
    get_settings.cache_clear()
    clear_db_caches()
    clear_mongo_cache()
    clear_redis_cache()

    # Python 3.13 currently deadlocks on FastAPI's in-process threadpool path
    # when sync route handlers are exercised via the test transport.
    fastapi.routing.run_in_threadpool = _run_sync_inline
    fastapi.dependencies.utils.run_in_threadpool = _run_sync_inline
    starlette.concurrency.run_in_threadpool = _run_sync_inline

    from app.main import create_app

    settings = get_settings()
    app = create_app()
    init_db(settings)

    session_factory = get_session_factory(settings.database_url)

    async def override_get_db_session():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    async def override_get_settings():
        return get_settings()

    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[get_settings] = override_get_settings

    test_client = ApiTestClient(app)
    _attach_verbose_http_logging(test_client)
    yield test_client
    test_client.close()

    get_settings.cache_clear()
    clear_db_caches()
    clear_mongo_cache()
    clear_redis_cache()
