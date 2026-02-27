from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    client_id: str = ""
    client_secret: str = ""
    tenant_id: str = "common"
    redirect_uri: str = "http://localhost:8000/auth/callback"
    frontend_url: str = "http://localhost:5173"
    secret_key: str = "change-this-secret-key"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
