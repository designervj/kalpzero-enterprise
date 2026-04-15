from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import SessionContext, create_access_token, get_current_session
from app.db.session import get_db_session
from app.schemas.requests import LoginRequest, RegisterRequest
from app.schemas.responses import LoginResponse, RegisterResponse, SessionResponse
from app.services.auth import authenticate_user, create_user

router = APIRouter()


@router.post("/register", response_model=RegisterResponse)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> RegisterResponse:
    user = create_user(db, payload)

    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)

    token = create_access_token(
        user_id=user.email,
        tenant_id=user.tenant_id or "platform_control",
        roles=user.roles,
        settings=settings,
    )

    return RegisterResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        session={
            "user_id": user.email,
            "tenant_id": user.tenant_id or "platform_control",
            "roles": user.roles,
        },
    )


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    user = authenticate_user(db, payload.email, payload.password)

    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    token = create_access_token(
        user_id=user.email,
        tenant_id=user.tenant_id or "platform_control",
        roles=user.roles,
        settings=settings,
    )

    return LoginResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        session={
            "user_id": user.email,
            "tenant_id": user.tenant_id or "platform_control",
            "roles": user.roles,
        },
    )


@router.get("/me", response_model=SessionResponse)
def me(session: SessionContext = Depends(get_current_session)) -> SessionResponse:
    return SessionResponse(
        user_id=session.user_id,
        tenant_id=session.tenant_id,
        roles=session.roles,
    )
