"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Central configuration for the Study Planner API."""

    # App
    app_name: str = "AI Study Planner"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./app.db"

    # JWT
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Gemini AI
    gemini_api_key: str = ""
    gemini_text_model: str = "gemini-2.0-flash"
    gemini_live_model: str = "gemini-2.0-flash-exp"
    use_gemini: bool = True

    # Storage & Cloudinary
    upload_dir: str = "./uploads"
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
