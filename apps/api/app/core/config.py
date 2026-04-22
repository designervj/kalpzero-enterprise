from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

FORBIDDEN_SECRET_VALUES = {
    "default-secret",
    "changeme",
    "replace-me",
    "kalp-zero-default-secret-change-in-production",
}
ROOT_ENV_FILE = Path(__file__).resolve().parents[4] / ".env"


class Settings(BaseSettings):
    env: str = Field(default="development", alias="KALPZERO_ENV")
    app_name: str = Field(default="KalpZero Enterprise API", alias="KALPZERO_APP_NAME")
    region: str = Field(default="in", alias="KALPZERO_REGION")
    jwt_secret: str = Field(alias="KALPZERO_JWT_SECRET")
    encryption_key: str = Field(alias="KALPZERO_ENCRYPTION_KEY")
    control_database_url: str = Field(
        validation_alias=AliasChoices("KALPZERO_CONTROL_DATABASE_URL", "KALPZERO_DATABASE_URL")
    )
    runtime_mongo_url: str = Field(
        validation_alias=AliasChoices("KALPZERO_RUNTIME_MONGO_URL", "KALPZERO_MONGO_URL")
    )
    runtime_doc_store_mode: str = Field(default="mongo", alias="KALPZERO_RUNTIME_DOC_STORE_MODE")
    runtime_mongo_db: str = Field(default="kalpzero_runtime", alias="KALPZERO_RUNTIME_MONGO_DB")
    ai_mongo_db: str = Field(default="kalpzero_ai", alias="KALPZERO_AI_MONGO_DB")
    ops_redis_url: str = Field(
        validation_alias=AliasChoices("KALPZERO_OPS_REDIS_URL", "KALPZERO_REDIS_URL")
    )
    public_web_url: str = Field(alias="KALPZERO_PUBLIC_WEB_URL")
    public_api_url: str = Field(alias="KALPZERO_PUBLIC_API_URL")
    openai_provider: str = Field(default="openai", alias="KALPZERO_OPENAI_PROVIDER")
    openai_api_key: str | None = Field(default=None, alias="KALPZERO_OPENAI_API_KEY")

    model_config = SettingsConfigDict(
        env_file=str(ROOT_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("jwt_secret", "encryption_key")
    @classmethod
    def validate_required_secrets(cls, value: str) -> str:
        if value.lower() in FORBIDDEN_SECRET_VALUES or len(value) < 32:
            raise ValueError("Secrets must be unique and at least 32 characters long.")
        return value

    @property
    def database_url(self) -> str:
        return self.control_database_url

    @property
    def mongo_url(self) -> str:
        return self.runtime_mongo_url

    @property
    def redis_url(self) -> str:
        return self.ops_redis_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
