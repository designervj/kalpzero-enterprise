from datetime import datetime
from beanie import Document
from pydantic import Field


class TimestampDocument(Document):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        use_revision = True
