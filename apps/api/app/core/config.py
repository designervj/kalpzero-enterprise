from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

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
    github_token: str | None = Field(default=None, alias="KALPZERO_GITHUB_TOKEN")
    github_repo_owner: str | None = Field(default=None, alias="KALPZERO_GITHUB_REPO_OWNER")
    github_template_owner: str | None = Field(default=None, alias="KALPZERO_GITHUB_TEMPLATE_OWNER")
    github_template_repo: str | None = Field(default=None, alias="KALPZERO_GITHUB_TEMPLATE_REPO")
    github_repo_prefix: str = Field(default="kalp-biz", alias="KALPZERO_GITHUB_REPO_PREFIX")
    github_default_branch: str = Field(default="main", alias="KALPZERO_GITHUB_DEFAULT_BRANCH")
    website_repo_private: bool = Field(default=True, alias="KALPZERO_WEBSITE_REPO_PRIVATE")
    website_provider: str = Field(default="github_vercel", alias="KALPZERO_WEBSITE_PROVIDER")
    website_root_domain: str | None = Field(default=None, alias="KALPZERO_WEBSITE_ROOT_DOMAIN")
    website_local_repo_root: str = Field(
        default="/mnt/data/kalpzero-enterprise/.business-sites",
        alias="KALPZERO_WEBSITE_LOCAL_REPO_ROOT",
    )
    website_public_url_mode: str = Field(default="path", alias="KALPZERO_WEBSITE_PUBLIC_URL_MODE")
    website_domain_provisioner_command: str = Field(
        default="/usr/local/sbin/kalpzero-domain-provision",
        alias="KALPZERO_WEBSITE_DOMAIN_PROVISIONER_COMMAND",
    )
    website_domain_provisioner_sudo: bool = Field(
        default=True,
        alias="KALPZERO_WEBSITE_DOMAIN_PROVISIONER_SUDO",
    )
    website_acme_email: str | None = Field(default=None, alias="KALPZERO_WEBSITE_ACME_EMAIL")
    website_server_public_ip: str | None = Field(default=None, alias="KALPZERO_SERVER_PUBLIC_IP")
    website_reserved_subdomains: str = Field(
        default="www,api,docs,admin",
        alias="KALPZERO_WEBSITE_RESERVED_SUBDOMAINS",
    )
    vercel_token: str | None = Field(default=None, alias="KALPZERO_VERCEL_TOKEN")
    vercel_team_id: str | None = Field(default=None, alias="KALPZERO_VERCEL_TEAM_ID")
    vercel_team_slug: str | None = Field(default=None, alias="KALPZERO_VERCEL_TEAM_SLUG")
    vercel_project_prefix: str = Field(default="kalp-biz", alias="KALPZERO_VERCEL_PROJECT_PREFIX")
    vercel_root_directory: str | None = Field(default=None, alias="KALPZERO_VERCEL_ROOT_DIRECTORY")
    vercel_install_command: str | None = Field(default=None, alias="KALPZERO_VERCEL_INSTALL_COMMAND")
    vercel_build_command: str | None = Field(default=None, alias="KALPZERO_VERCEL_BUILD_COMMAND")
    vercel_output_directory: str | None = Field(default=None, alias="KALPZERO_VERCEL_OUTPUT_DIRECTORY")

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

    @field_validator("website_provider")
    @classmethod
    def validate_website_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"github_vercel", "github_self_hosted"}:
            raise ValueError("KALPZERO_WEBSITE_PROVIDER must be github_vercel or github_self_hosted.")
        return normalized

    @field_validator("website_public_url_mode")
    @classmethod
    def validate_website_public_url_mode(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"path", "subdomain"}:
            raise ValueError("KALPZERO_WEBSITE_PUBLIC_URL_MODE must be path or subdomain.")
        return normalized

    @property
    def website_root_host(self) -> str:
        explicit = (self.website_root_domain or "").strip().lower()
        if explicit:
            return explicit
        parsed = urlparse(self.public_web_url)
        return parsed.hostname.lower() if parsed.hostname else "kalptree.xyz"

    @property
    def website_reserved_subdomain_labels(self) -> set[str]:
        return {
            entry.strip().lower()
            for entry in self.website_reserved_subdomains.split(",")
            if entry.strip()
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
