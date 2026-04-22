from fastapi import APIRouter

from app.api.routes import ai, auth, commerce, commerce_cart, forms, health, hotel, imports, messaging, platform, publishing, theme, travel

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
api_router.include_router(commerce.router, prefix="/commerce", tags=["commerce"])
api_router.include_router(commerce_cart.router, prefix="/commerce/cart", tags=["commerce-cart"])
api_router.include_router(travel.router, prefix="/travel", tags=["travel"])
api_router.include_router(hotel.router, prefix="/hotel", tags=["hotel"])
api_router.include_router(publishing.router, prefix="/publishing", tags=["publishing"])
api_router.include_router(messaging.router, prefix="/messaging", tags=["messaging"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(theme.router, prefix="/theme", tags=["theme"])
