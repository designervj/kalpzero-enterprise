from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import SessionContext, get_current_session
from app.schemas.requests import ThemeConfig
from app.services.themeservice import get_theme as get_theme_service, update_theme as update_theme_service


router = APIRouter()

@router.get("")
async def get_theme(
    session: SessionContext = Depends(get_current_session)
):
    db_name = session.tenant_db_name or "default"
    forms = await get_theme_service(db_name)
    payload = forms["payload"]
    return {"data": payload["public_theme"], "success": True, "id": forms["id"]}

    

@router.put("/{id}")
async def update_theme(
    id: str,
    data: ThemeConfig,
    session: SessionContext = Depends(get_current_session)
):
    db_name = session.tenant_db_name or "default"
    forms = await update_theme_service(db_name, id, data)
    print(forms)
    payload = forms["payload"]
    return {"data": payload["public_theme"], "success": True, "id": forms["id"]}
