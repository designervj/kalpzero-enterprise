from datetime import datetime
from uuid import uuid4
from beanie import Document
from pydantic import Field


class TimestampDocument(Document):
    id: str = Field(default_factory=lambda: uuid4().hex, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        use_revision = True
