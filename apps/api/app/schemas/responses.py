from pydantic import BaseModel


class SessionResponse(BaseModel):
    user_id: str
    tenant_id: str
    roles: list[str]


class LoginResponse(BaseModel):
    access_token: str
    expires_at: str
    session: SessionResponse

class RegisterResponse(BaseModel):
    access_token: str
    expires_at: str
    session: SessionResponse
