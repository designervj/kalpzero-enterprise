from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.db.mongo import build_runtime_database_name

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
    if not x_tenant_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-Slug header is required for this operation.",
        )
    return x_tenant_slug


def _resolve_tenant_db_name(
    *,
    tenant_slug: str | None,
    x_tenant_db: str | None,
    settings: Settings,
) -> str | None:
    if x_tenant_db:
        return x_tenant_db
    if not tenant_slug or tenant_slug == "platform_control":
        return None
    return build_runtime_database_name(settings, tenant_slug=tenant_slug)


def get_current_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    auth_token: Annotated[str | None, Cookie()] = None,
    x_tenant_db: str | None = Header(None, alias="x-tenant-db"),
    settings: Settings = Depends(get_settings),
) -> SessionContext:
    token = None
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    elif auth_token:
        token = auth_token

    if token:
        payload = decode_access_token(token, settings)
        context = SessionContext(
            user_id=payload.id,
            email=payload.email,
            tenant_id=payload.tenant_id,
            tenant_db_name=_resolve_tenant_db_name(
                tenant_slug=payload.tenant_id,
                x_tenant_db=x_tenant_db,
                settings=settings,
            ),
            role=payload.role,
        )
        return context
    else:
        context = SessionContext(
            user_id=None,
            email=None,
            tenant_id=None,
            tenant_db_name=x_tenant_db,
            role="guest",
        )
        
        return context
