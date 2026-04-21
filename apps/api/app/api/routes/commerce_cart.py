import uuid
from fastapi import APIRouter, Depends, Response, Cookie, Query
from app.core.security import SessionContext, get_current_session
from app.schemas.requests import AddToCartRequest, UpdateCartItemRequest
from app.services import commerce_cart

router = APIRouter()

def get_or_generate_session_id(cart_session_id: str | None = Cookie(None)) -> str:
    if not cart_session_id:
        return str(uuid.uuid4())
    return cart_session_id

@router.get("/")
async def get_cart(
    response: Response,
    session_id: str = Depends(get_or_generate_session_id),
    session: SessionContext = Depends(get_current_session),
):
    # Ensure tenant_db_name is available
    db_name = session.tenant_db_name or "default"
    
    # Set/Refresh the session cookie
    response.set_cookie(
        key="cart_session_id",
        value=session_id,
        httponly=True,
        max_age=60 * 60 * 24 * 30, # 30 days
        samesite="lax"
    )
    
    result = await commerce_cart.get_or_create_cart(
        db_name=db_name,
        session_id=session_id,
        user_id=session.user_id
    )
    
    if result["clear_session_cookie"]:
        response.delete_cookie("cart_session_id")
        
    return {
        "message": "Cart fetched successfully",
        "data": result["items"],
        "status": 200
    }

@router.post("/")
async def add_to_cart(
    payload: AddToCartRequest,
    response: Response,
    session_id: str = Depends(get_or_generate_session_id),
    session: SessionContext = Depends(get_current_session),
):
    db_name = session.tenant_db_name or "default"
    
    response.set_cookie(
        key="cart_session_id",
        value=session_id,
        httponly=True,
        max_age=60 * 60 * 24 * 30,
        samesite="lax"
    )
    
    items = await commerce_cart.add_item_to_cart(
        db_name=db_name,
        session_id=session_id,
        user_id=session.user_id,
        item_data=payload.model_dump()
    )
    
    return {
        "message": "Item added to cart",
        "data": items,
        "status": 200
    }

@router.put("/")
async def update_cart_item(
    payload: UpdateCartItemRequest,
    session: SessionContext = Depends(get_current_session),
    cart_session_id: str | None = Cookie(None)
):
    db_name = session.tenant_db_name or "default"
    
    if not cart_session_id and not session.user_id:
        return {"message": "No active session", "data": [], "status": 400}
        
    items = await commerce_cart.update_item_quantity(
        db_name=db_name,
        session_id=cart_session_id,
        user_id=session.user_id,
        cartItemId=payload.cartItemId,
        quantity=payload.quantity
    )
    
    return {
        "message": "Cart updated successfully",
        "data": items,
        "status": 200
    }

@router.delete("/")
async def remove_from_cart(
    cartItemId: str | None = Query(None),
    clear: str | None = Query(None),
    session: SessionContext = Depends(get_current_session),
    cart_session_id: str | None = Cookie(None)
):
    db_name = session.tenant_db_name or "default"
    
    if not cart_session_id and not session.user_id:
        return {"message": "No active session", "data": [], "status": 400}

    is_clear = clear == "true"
    
    items = await commerce_cart.remove_from_cart(
        db_name=db_name,
        session_id=cart_session_id,
        user_id=session.user_id,
        cartItemId=cartItemId,
        clear=is_clear
    )
    
    message = "Cart cleared successfully" if is_clear else "Item removed from cart"
    
    return {
        "message": message,
        "data": items,
        "status": 200
    }
