from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import (
    get_redoc_html,
    get_swagger_ui_html,
    get_swagger_ui_oauth2_redirect_html,
)
from fastapi.responses import HTMLResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    init_db(settings)
    
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3001", "https://allied-surplus-q4wa.vercel.app/"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router)

    def resolve_docs_prefix(request: Request) -> str:
        host = request.headers.get("host", "").lower()
        if host.startswith(("127.0.0.1", "localhost", "testserver")) or host.endswith(":8012"):
            return ""
        return "/api"

    @application.get("/docs", include_in_schema=False)
    async def swagger_ui(request: Request) -> HTMLResponse:
        prefix = resolve_docs_prefix(request)
        return get_swagger_ui_html(
            openapi_url=f"{prefix}{application.openapi_url}",
            title=f"{application.title} - Swagger UI",
            oauth2_redirect_url=f"{prefix}/docs/oauth2-redirect",
        )

    @application.get("/docs/oauth2-redirect", include_in_schema=False)
    async def swagger_ui_redirect() -> HTMLResponse:
        return get_swagger_ui_oauth2_redirect_html()

    @application.get("/redoc", include_in_schema=False)
    async def redoc_ui(request: Request) -> HTMLResponse:
        prefix = resolve_docs_prefix(request)
        return get_redoc_html(
            openapi_url=f"{prefix}{application.openapi_url}",
            title=f"{application.title} - ReDoc",
        )

    return application


app = create_app()
