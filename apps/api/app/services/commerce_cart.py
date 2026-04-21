from datetime import UTC, datetime
from typing import Any
from bson import ObjectId
from app.repositories import commerce as commerce_repository

async def get_or_create_cart(db_name: str, session_id: str, user_id: str | None = None) -> dict[str, Any]:
    """
    Fetches the cart for the given session and user.
    If user_id is provided, merges the guest cart into the user cart.
    Returns the final items and a flag if the session cookie should be cleared.
    """
    # 1. Fetch guest cart
    guest_cart = await commerce_repository.get_cart_by_session_id(db_name, session_id)
    clear_session_cookie = False
    
    if not user_id:
        return {"items": guest_cart.get("items", []) if guest_cart else [], "clear_session_cookie": False}
    
    # 2. Handle user-specific logic
    user_cart = await commerce_repository.get_cart_by_user_id(db_name, user_id)
    
    final_cart = None
    
    if user_cart and user_cart.get("items") and guest_cart and guest_cart.get("items"):
        # Both exist and have items - Merge guest into user
        merged_items = list(user_cart.get("items", []))
        for g_item in guest_cart["items"]:
            existing_item = next((item for item in merged_items if item.get("cartItemId") == g_item.get("cartItemId")), None)
            if existing_item:
                existing_item["quantity"] += g_item.get("quantity", 0)
            else:
                merged_items.append(g_item)
        
        await commerce_repository.update_cart(db_name, user_cart["id"], {"items": merged_items})
        user_cart["items"] = merged_items
        final_cart = user_cart
    elif user_cart:
        # Only user cart exists (or guest is empty)
        final_cart = user_cart
    elif guest_cart:
        # User cart doesn't exist, but guest cart does - Convert guest items to user cart
        final_cart = await commerce_repository.create_cart(db_name, {
            "userId": user_id,
            "items": guest_cart.get("items", []),
            "createdAt": datetime.now(tz=UTC),
            "updatedAt": datetime.now(tz=UTC)
        })
    else:
        # Neither exists
        final_cart = {"items": []}
        
    # Final cleanup for User-mode: delete any guest cart by sessionId
    if guest_cart:
        await commerce_repository.delete_cart_by_session_id(db_name, session_id)
        clear_session_cookie = True
        
    return {"items": final_cart.get("items", []) if final_cart else [], "clear_session_cookie": clear_session_cookie}

async def add_item_to_cart(db_name: str, session_id: str, user_id: str | None, item_data: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Adds an item to the cart. If the item already exists (by cartItemId), increments quantity.
    item_data is expected to be the full product snapshot.
    """
    if user_id:
        cart = await commerce_repository.get_cart_by_user_id(db_name, user_id)
    else:
        cart = await commerce_repository.get_cart_by_session_id(db_name, session_id)
        
    cart_item_id = item_data.get("cartItemId")
    quantity_to_add = item_data.get("quantity", 1)
        
    if cart:
        items = list(cart.get("items", []))
        existing_item_index = next((i for i, item in enumerate(items) if item.get("cartItemId") == cart_item_id), -1)
        
        if existing_item_index > -1:
            items[existing_item_index]["quantity"] += quantity_to_add
            # Update updatedAt on the item if needed? The parent document has it anyway.
            await commerce_repository.update_cart(db_name, cart["id"], {"items": items})
        else:
            items.append(item_data)
            await commerce_repository.update_cart(db_name, cart["id"], {"items": items})
        
        return items
    else:
        new_cart_obj = {
            "items": [item_data],
            "createdAt": datetime.now(tz=UTC),
            "updatedAt": datetime.now(tz=UTC)
        }
        if user_id:
            new_cart_obj["userId"] = user_id
        else:
            new_cart_obj["sessionId"] = session_id
            
        new_cart = await commerce_repository.create_cart(db_name, new_cart_obj)
        return new_cart.get("items", [])

async def update_item_quantity(db_name: str, session_id: str, user_id: str | None, cartItemId: str, quantity: int) -> list[dict[str, Any]]:
    """
    Updates the quantity of a specific item in the cart. If quantity is 0, removes the item.
    """
    if user_id:
        cart = await commerce_repository.get_cart_by_user_id(db_name, user_id)
    else:
        cart = await commerce_repository.get_cart_by_session_id(db_name, session_id)
        
    if not cart:
        return []
        
    items = list(cart.get("items", []))
    item_index = next((i for i, item in enumerate(items) if item.get("cartItemId") == cartItemId), -1)
    
    if item_index > -1:
        if quantity <= 0:
            items.pop(item_index)
        else:
            items[item_index]["quantity"] = quantity
            
        await commerce_repository.update_cart(db_name, cart["id"], {"items": items})
        return items
    
    return items

async def remove_from_cart(db_name: str, session_id: str, user_id: str | None, cartItemId: str | None = None, clear: bool = False) -> list[dict[str, Any]]:
    """
    Removes a specific item from the cart or clears the entire cart.
    """
    if user_id:
        cart = await commerce_repository.get_cart_by_user_id(db_name, user_id)
    else:
        cart = await commerce_repository.get_cart_by_session_id(db_name, session_id)
        
    if not cart:
        return []
        
    if clear:
        await commerce_repository.update_cart(db_name, cart["id"], {"items": []})
        return []
        
    if not cartItemId:
        return cart.get("items", [])
        
    items = [item for item in cart.get("items", []) if item.get("cartItemId") != cartItemId]
    await commerce_repository.update_cart(db_name, cart["id"], {"items": items})
    return items
