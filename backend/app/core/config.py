from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    DATABASE_URL: str = (
        "postgresql+asyncpg://gym:gym_dev_2026@localhost:5432/gymforce"
    )
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:8081", "http://localhost:3000"]
    )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
