from datetime import datetime, UTC
from pydantic import BaseModel, Field, ConfigDict


class TimestampDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., validation_alias="id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        alias="createdAt"
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        alias="updatedAt"
    )
