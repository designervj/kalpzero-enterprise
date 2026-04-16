from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import CustomerModel


def get_customer_by_email(db: Session, *, tenant_id: str, email: str) -> CustomerModel | None:
    return db.scalar(
        select(CustomerModel).where(
            CustomerModel.tenant_id == tenant_id,
            CustomerModel.email == email
        )
    )


def create_customer(
    db: Session,
    *,
    tenant_id: str,
    first_name: str,
    last_name: str,
    email: str,
    hashed_password: str,
    addresses: list[dict[str, Any]] | None = None,
) -> CustomerModel:
    customer = CustomerModel(
        tenant_id=tenant_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        hashed_password=hashed_password,
        addresses=addresses or []
    )
    db.add(customer)
    db.flush()
    return customer
