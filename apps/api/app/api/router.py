from fastapi import APIRouter, Depends, Header, HTTPException

from app.api.routes import ai, auth, commerce, health, hotel, imports, platform, publishing, travel

def require_tenant_db(x_tenant_db: str | None = Header(None, alias="x-tenant-db")):
    if not x_tenant_db:
        raise HTTPException(status_code=400, detail="x-tenant-db header is required for this operation")
    return x_tenant_db

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(commerce.router, prefix="/commerce", tags=["commerce"], dependencies=[Depends(require_tenant_db)])
api_router.include_router(travel.router, prefix="/travel", tags=["travel"], dependencies=[Depends(require_tenant_db)])
api_router.include_router(hotel.router, prefix="/hotel", tags=["hotel"], dependencies=[Depends(require_tenant_db)])
api_router.include_router(publishing.router, prefix="/publishing", tags=["publishing"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
