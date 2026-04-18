from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from sqlalchemy.orm import Session



http_bearer = HTTPBearer(auto_error=False)
ALGORITHM = "HS256"


class TokenPayload(BaseModel):
    id: str
    email: str
    tenant_id: str
    role: str
    exp: int


class SessionContext(BaseModel):
    user_id: str | None
    email: str | None
    tenant_id: str | None
    role: str
    tenant_db_name: str | None = None


def create_access_token(
    *,
    id: str,
    email: str,
    tenant_id: str,
    role: str,
    settings: Settings,
    expires_delta: timedelta = timedelta(hours=8),
) -> str:
    expire_at = datetime.now(tz=UTC) + expires_delta
    payload = {
        "id": id,
        "email": email,
        "tenant_id": tenant_id,
        "role": role,
        "exp": int(expire_at.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str, settings: Settings) -> TokenPayload:
    try:
        raw_payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc

    return TokenPayload(**raw_payload)


def get_tenant_slug(
    x_tenant_slug: Annotated[str | None, Header(alias="X-Tenant-Slug")] = None,
) -> str:
    """
    Extracts the tenant slug from the X-Tenant-Slug header.
    Used for public routes where JWT is not available.
    """
    if not x_tenant_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-Slug header is required for this operation.",
        )
    return x_tenant_slug


from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional
from app.db.session import get_db_session

def get_current_session(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    x_tenant_db: Optional[str] = Header(None, alias="x-tenant-db"),
    settings: Settings = Depends(get_settings),
) -> SessionContext:

    # Case 1: Bearer token exists
    if credentials and credentials.scheme.lower() == "bearer":
        payload = decode_access_token(credentials.credentials, settings)
        return SessionContext(
            user_id=payload.id,
            email=payload.email,
            tenant_id=payload.tenant_id,
            tenant_db_name=x_tenant_db,
            role=payload.role,
        )
    else:
        return SessionContext(
            user_id=None,
            email=None,
            tenant_id=None,
            tenant_db_name=x_tenant_db,
            role="guest",
        )



