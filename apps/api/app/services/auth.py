import base64
import hashlib
import hmac
import secrets

try:
    import bcrypt  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    bcrypt = None
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import TenantModel, UserModel
from app.schemas.requests import RegisterRequest, UpdateProfileRequest


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(raw: str) -> bytes:
    padded = raw + "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def hash_password(password: str) -> str:
    if bcrypt is not None and get_settings().env not in {"test", "testing"}:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    iterations = 600_000
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations, dklen=32)
    return f"pbkdf2_sha256${iterations}${_b64encode(salt)}${_b64encode(derived)}"


def verify_password(password: str, hashed: str) -> bool:
    if hashed.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt, expected = hashed.split("$", 3)
            iterations_int = int(iterations)
        except ValueError:
            return False

        derived = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), _b64decode(salt), iterations_int, dklen=32
        )
        return hmac.compare_digest(_b64encode(derived), expected)

    if bcrypt is None:
        return False

    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_user(
    db: Session,
    payload: RegisterRequest,
) -> UserModel:
    is_platform_admin = payload.email.endswith("@kalpzero.com") or payload.tenant_slug == "platform_control"
    tenant_id: str | None = None

    if is_platform_admin:
        role = "platform_admin"
    else:
        tenant_info = db.scalar(select(TenantModel).where(TenantModel.slug == payload.tenant_slug))
        if not tenant_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found.",
            )
        tenant_id = tenant_info.id
        role = payload.role or "tenant_admin"

    existing_user = db.scalar(
        select(UserModel).where(and_(UserModel.email == payload.email, UserModel.tenant_id == tenant_id))
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists.",
        )

    # ✅ Hash password
    hashed_password = hash_password(payload.password)

    # ✅ Create user
    new_user = UserModel(
        email=payload.email,
        hashed_password=hashed_password,
        tenant_id=tenant_id,
        role=role,
        istenantowner=payload.istenantowner,
    )

    resolved_name = " ".join(part for part in [payload.first_name, payload.last_name] if part).strip()
    if not resolved_name:
        resolved_name = payload.name or payload.email.split("@", 1)[0]

    if role == "customer":
        new_user.name = resolved_name
        new_user.first_name = payload.first_name
        new_user.last_name = payload.last_name
        new_user.addresses = []
        new_user.wishlist = []
    else:
        new_user.name = resolved_name
        new_user.first_name = payload.first_name
        new_user.last_name = payload.last_name

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
    tenant_slug: str | None = None,
) -> UserModel:
    user = db.scalar(select(UserModel).where(UserModel.email == email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if tenant_slug:
        if tenant_slug == "platform_control":
            expected_tenant_id = None
        else:
            tenant = db.scalar(select(TenantModel).where(TenantModel.slug == tenant_slug))
            expected_tenant_id = tenant.id if tenant else None

        if user.tenant_id != expected_tenant_id:
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

def update_user(
    db: Session,
    update_payload: UpdateProfileRequest
) -> UserModel:
    # Find user by user_id
    user = db.get(UserModel, update_payload.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Update user fields
    if update_payload.email:
        user.email = update_payload.email

    if update_payload.first_name:
        user.first_name = update_payload.first_name

    if update_payload.last_name:
        user.last_name = update_payload.last_name

    if update_payload.name:
        user.name = update_payload.name

    if update_payload.addresses is not None:
        user.addresses = update_payload.addresses

    if update_payload.wishlist is not None:
        user.wishlist = update_payload.wishlist

    if update_payload.password:
        user.hashed_password = hash_password(update_payload.password)

    db.commit()
    db.refresh(user)
    return user

