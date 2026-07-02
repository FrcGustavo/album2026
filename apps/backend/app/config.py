from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./data/album.sqlite")
    auto_create_tables: bool = Field(default=True)
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=1440)
    cors_origins: str = Field(default="")

    model_config = SettingsConfigDict(env_prefix="ALBUM_")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    validate_settings(settings)
    if settings.database_url.startswith("sqlite:///./"):
        Path(settings.database_url.removeprefix("sqlite:///./")).parent.mkdir(parents=True, exist_ok=True)
    return settings


def validate_settings(settings: Settings) -> None:
    env = settings.env.lower()
    if env == "production" and settings.jwt_secret_key == "change-me-in-production":
        raise ValueError("ALBUM_JWT_SECRET_KEY es obligatorio en production")
    if env == "production" and settings.auto_create_tables:
        raise ValueError("ALBUM_AUTO_CREATE_TABLES=false es obligatorio en production; usa migraciones Alembic")
    if env == "production" and not settings.cors_origin_list:
        raise ValueError("ALBUM_CORS_ORIGINS es obligatorio en production")
