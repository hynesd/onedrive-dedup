from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    CLIENT_ID: str = ""
    CLIENT_SECRET: str = ""
    TENANT_ID: str = "common"
    REDIRECT_URI: str = "http://localhost:8000/auth/callback"
    FRONTEND_URL: str = "http://localhost:5173"
    SECRET_KEY: str = "change-me-in-production"
    SECURE_COOKIES: bool = False  # Set True when serving over HTTPS in production

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
