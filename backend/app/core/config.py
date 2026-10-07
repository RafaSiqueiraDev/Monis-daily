from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    PROJECT_NAME: str = "Monis Daily"
    ENVIRONMENT: str = "development"

    # Closed beta: registo exige este código. Define o valor real no .env
    # (local) e nas env vars do Render (produção) — nunca commitado no código.
    REGISTRATION_INVITE_CODE: str = "change-me"
    FRONTEND_URL: str = "https://monis-daily-ashen.vercel.app"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
