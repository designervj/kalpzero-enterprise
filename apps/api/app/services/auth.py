import base64
import hashlib
import hmac
import secrets

try:
    import bcrypt  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    bcrypt = None
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.models import CustomerModel, TenantModel, UserModel
from app.repositories import auth as auth_repository
from app.schemas.requests import CreateCustomerRequest, RegisterRequest


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(raw: str) -> bytes:
    padded = raw + "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def hash_password(password: str) -> str:
    if bcrypt is not None:
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
    
    # ✅ Check if user already exists
    existing_user = db.scalar(select(UserModel).where(UserModel.email == payload.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists.",
        )

    # ✅ Determine role and tenant_id
    role = payload.role or "tenant_admin"

    tenant_id = None

    if payload.email.endswith("@kalpzero.com") or payload.tenant_slug == "platform_control":
        role = "platform_admin"
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
        role=role,
        name=payload.name,
        istenantowner=payload.istenantowner,
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


def create_customer(
    db: Session,
    payload: CreateCustomerRequest,
) -> CustomerModel:
    # ✅ Find tenant

    tenant = db.scalar(select(TenantModel).where(TenantModel.slug == payload.tenant_slug))
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found.",
        )

    # ✅ Check if customer already exists IN THIS TENANT
    existing = auth_repository.get_customer_by_email(db, tenant_id=tenant.id, email=payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this email already exists for this tenant.",
        )

    # ✅ Hash password
    hashed_password = hash_password(payload.password)

    # ✅ Create customer
    customer = auth_repository.create_customer(
        db,
        tenant_id=tenant.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        hashed_password=hashed_password,
        addresses=[addr.model_dump() for addr in payload.addresses]
    )

    db.commit()
    db.refresh(customer)
    return customer


def authenticate_customer(
    db: Session,
    tenant_slug: str,
    email: str,
    password: str,
) -> CustomerModel:
    tenant = db.scalar(select(TenantModel).where(TenantModel.slug == tenant_slug))
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found.",
        )

    customer = auth_repository.get_customer_by_email(db, tenant_id=tenant.id, email=email)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return customer
