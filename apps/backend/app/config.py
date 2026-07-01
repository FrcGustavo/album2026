from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./data/panini.sqlite")
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=1440)
    cors_origins: list[str] = [
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ]

    model_config = SettingsConfigDict(env_prefix="PANINI_")


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
        raise ValueError("PANINI_JWT_SECRET_KEY es obligatorio en production")
