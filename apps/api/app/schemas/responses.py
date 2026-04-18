from pydantic import BaseModel


class SessionResponse(BaseModel):
    email: str
    tenant_id: str
    role: str
    name: str
    isTenantOwner: bool


class LoginResponse(BaseModel):
    access_token: str
    expires_at: str
    session: SessionResponse

class RegisterResponse(BaseModel):
    access_token: str
    expires_at: str
    session: SessionResponse
