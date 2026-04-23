from pydantic import BaseModel
from typing import Any


class SessionResponse(BaseModel):
    id: str
    email: str
    tenant_id: str | None = None
    role: str
    name: str | None = None
    isTenantOwner: bool
    first_name:str | None = None
    last_name:str | None = None
    addresses: list[Any] | None = None
    wishlist: list[Any] | None = None


class LoginResponse(BaseModel):
    access_token: str
    expires_at: str
    session: SessionResponse

class RegisterResponse(BaseModel):
    access_token: str
    expires_at: str
    session: SessionResponse
