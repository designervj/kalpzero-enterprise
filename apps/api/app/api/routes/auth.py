from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import Settings, get_settings
from app.core.security import SessionContext, create_access_token, get_current_session
from app.db.session import get_db_session
from app.schemas.requests import CreateCustomerRequest, LoginCustomerRequest, LoginRequest, RegisterRequest
from app.schemas.responses import LoginResponse, RegisterResponse, SessionResponse
from app.services.auth import (
    authenticate_customer,
    authenticate_user,
    create_customer,
    create_user,
)
from app.db.models import UserModel

router = APIRouter()


@router.post("/register", response_model=RegisterResponse)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> RegisterResponse:
    user = create_user(db, payload)

    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)

    token = create_access_token(
        id=user.id,
        email=user.email,
        tenant_id=user.tenant_id or "platform_control",
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
        session={
            "email": user.email,
            "tenant_id": user.tenant_id or "platform_control",
            "role": user.role,
            "name": user.name,
            "isTenantOwner": user.istenantowner,
        },
    )


@router.post("/login", response_model=LoginResponse)
def login(
    response: Response,
    payload: LoginRequest,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    user = authenticate_user(db, payload.email, payload.password)
    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    token = create_access_token(
        id=user.id,
        email=user.email,
        tenant_id=user.tenant_id or "platform_control",
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
        session={
            "email": user.email,
            "tenant_id": user.tenant_id or "platform_control",
            "role": user.role,
            "name": user.name,
            "isTenantOwner": user.istenantowner,
        },
    )


@router.get("/me", response_model=SessionResponse)
def me(
    db: Session = Depends(get_db_session),
    session: SessionContext = Depends(get_current_session),
) -> SessionResponse:

    user = db.scalar(select(UserModel).where(UserModel.id == session.user_id))
    return SessionResponse(
        email=session.email,
        tenant_id=session.tenant_id,
        role=session.role,
        name=user.name,
        isTenantOwner=user.istenantowner,
    )


@router.post("/register/customer", response_model=RegisterResponse)
def register_customer(
    payload: CreateCustomerRequest,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> RegisterResponse:

    customer = create_customer(db, payload)

    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    token = create_access_token(
        user_id=customer.email,
        tenant_id=payload.tenant_slug,
        role=customer.role,
        settings=settings,
    )

    return RegisterResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        session={
            "user_id": customer.email,
            "tenant_id": payload.tenant_slug,
            "role": customer.role,
        },
    )


@router.post("/login/customer", response_model=LoginResponse)
def login_customer(
    payload: LoginCustomerRequest,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    customer = authenticate_customer(
        db,
        tenant_slug=payload.tenant_slug,
        email=payload.email,
        password=payload.password,
    )

    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    token = create_access_token(
        user_id=customer.email,
        tenant_id=payload.tenant_slug,
        role=customer.role,
        settings=settings,
    )

    return LoginResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        session={
            "user_id": customer.email,
            "tenant_id": payload.tenant_slug,
            "role": customer.role,
        },
    )
