from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import SessionContext, get_current_session
from app.schemas.requests import CreateFormRequest, UpdateFormRequest
from app.services import forms as forms_service

router = APIRouter()

@router.get("/")
async def list_forms(
    session: SessionContext = Depends(get_current_session)
):
    db_name = session.tenant_db_name or "default"
    forms = await forms_service.list_forms(db_name)
    return {"data": forms}

@router.post("/")
async def create_form(
    payload: CreateFormRequest,
    session: SessionContext = Depends(get_current_session)
):
    db_name = session.tenant_db_name or "default"
    form = await forms_service.create_form(db_name, payload.model_dump())
    return {"data": form}

@router.put("/")
async def update_form(
    payload: UpdateFormRequest,
    id: str = Query(..., description="The ID of the form to update"),
    session: SessionContext = Depends(get_current_session)
):
    db_name = session.tenant_db_name or "default"
    form = await forms_service.update_form(db_name, id, payload.model_dump())
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FORM NOT FOUND"
        )
        
    return {"data": form}

@router.delete("/")
async def delete_form(
    id: str = Query(..., description="The ID of the form to delete"),
    session: SessionContext = Depends(get_current_session)
):
    db_name = session.tenant_db_name or "default"
    success = await forms_service.delete_form(db_name, id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FORM NOT FOUND"
        )
        
    return {"message": "FORM DELETED SUCCESSFULLY"}
