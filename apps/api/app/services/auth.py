import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.models import TenantModel, UserModel
from app.schemas.requests import RegisterRequest


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_user(
    db: Session,
    payload: RegisterRequest,
) -> UserModel:
    # ✅ Check if user already exists
    existing_user = db.scalar(select(UserModel).where(UserModel.email == payload.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists.",
        )

    # ✅ Determine roles and tenant_id
    roles = payload.role or ["tenant_admin"]

    tenant_id = None


    if payload.email.endswith("@kalpzero.com") or payload.tenant_slug == "platform_control":
        roles = ["platform_admin"]
        tenant_id = None
    else:
        tenant_info = db.scalar(select(TenantModel).where(TenantModel.slug == payload.tenant_slug))
        if not tenant_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found.",
            )
        
        tenant_id = tenant_info.id

    # ✅ Hash password
    hashed_password = hash_password(payload.password)

    # ✅ Create user
    new_user = UserModel(
        email=payload.email,
        hashed_password=hashed_password,
        tenant_id=tenant_id,
        roles=roles,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> UserModel:
    user = db.scalar(select(UserModel).where(UserModel.email == email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return user
