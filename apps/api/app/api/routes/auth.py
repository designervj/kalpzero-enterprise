from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import Settings, get_settings
from app.core.security import SessionContext, create_access_token, get_current_session
from app.db.models import TenantModel, UserModel
from app.db.session import get_db_session
from app.schemas.requests import (
    LoginRequest,
    MagicLoginRequest,
    RegisterRequest,
    UpdateProfileRequest
)
from app.schemas.responses import LoginResponse, RegisterResponse, SessionResponse
from app.services.auth import (
    authenticate_user,
    create_user,
    update_user,
)
from app.db.models import UserModel

router = APIRouter()


def _resolve_tenant_slug(db: Session, tenant_id: str | None) -> str:
    if tenant_id is None:
        return "platform_control"
    tenant = db.get(TenantModel, tenant_id)
    return tenant.slug if tenant else tenant_id


def _serialize_user_session(db: Session, user: UserModel) -> SessionResponse:
    return SessionResponse(
        id=user.id,
        email=user.email,
        tenant_id=_resolve_tenant_slug(db, user.tenant_id),
        role=user.role,
        name=user.name,
        isTenantOwner=user.istenantowner,
        first_name=user.first_name,
        last_name=user.last_name,
        addresses=user.addresses,
        wishlist=user.wishlist,
    )




@router.post("/register", response_model=RegisterResponse)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> RegisterResponse:
    user = create_user(db, payload)
    session_payload = _serialize_user_session(db, user)
    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    token = create_access_token(
        id=user.id,
        email=user.email,
        tenant_id=session_payload.tenant_id,
        role=user.role,
        settings=settings,
    )

    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1440 * 60,
        path="/",
    )

    return RegisterResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        session=session_payload,
    )

@router.patch("/update-profile")
def update_profile(
    payload: UpdateProfileRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
 
    user = update_user(db, payload)
    session_payload = _serialize_user_session(db, user)
    return {
        "user": session_payload,
        "message": "Profile updated successfully.",
    }


@router.post("/login", response_model=LoginResponse)
def login(
    response: Response,
    payload: LoginRequest,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    user = authenticate_user(db, payload.email, payload.password, tenant_slug=payload.tenant_slug)
    session_payload = _serialize_user_session(db, user)
    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    token = create_access_token(
        id=user.id,
        email=user.email,
        tenant_id=session_payload.tenant_id,
        role=user.role,
        settings=settings,
    )

    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1440 * 60,
        path="/",
    )

    return LoginResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        session=session_payload,
    )


@router.post("/logout")
def logout(
    response: Response,
    session: SessionContext = Depends(get_current_session),
    db: Session = Depends(get_db_session),
):
    response.delete_cookie(
        key="auth_token",
        path="/",
    )
    return {
        "access_token": "",
        "expires_at": datetime.now(tz=UTC).isoformat(),
        "session": None,
    }

@router.get("/me", response_model=SessionResponse)
def me(
    session: SessionContext = Depends(get_current_session),
    db: Session = Depends(get_db_session),
) -> SessionResponse:
    if session.user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    user = db.get(UserModel, session.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    return _serialize_user_session(db, user)



@router.get("/magic/options")
def get_magic_options(
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    if settings.env not in ["development", "test", "testing"]:
        return {"users": []}

    users = db.scalars(
        select(UserModel)
        .where(UserModel.role.in_(["platform_admin", "tenant_admin"]))
        .limit(10)
    ).all()

    options = []
    for user in users:
        tenant_slug = _resolve_tenant_slug(db, user.tenant_id) if user.tenant_id else None
        options.append(
            {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "name": user.name or user.email.split("@")[0].capitalize(),
                "tenant_slug": tenant_slug,
            }
        )

    return {"users": options}


@router.post("/magic/login", response_model=LoginResponse)
def magic_login(
    payload: MagicLoginRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    if settings.env not in ["development", "test", "testing"]:
        raise HTTPException(status_code=403, detail="Magic login disabled in this environment")

    user = db.get(UserModel, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session_payload = _serialize_user_session(db, user)
    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    token = create_access_token(
        id=user.id,
        email=user.email,
        tenant_id=session_payload.tenant_id,
        role=user.role,
        settings=settings,
    )

    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1440 * 60,
        path="/",
    )

    return LoginResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        session=session_payload,
    )
