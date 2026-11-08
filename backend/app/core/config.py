from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_DEFAULTS = {
    "SECRET_KEY": "change-me-in-production",
    "REGISTRATION_INVITE_CODE": "change-me",
}


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

    # Cotações de mercado (Fase A). O Yahoo não precisa de chave; os outros
    # provedores só entram na cadeia de fallback se a chave estiver definida
    # (o brapi funciona sem token apenas para alguns tickers da B3).
    BRAPI_TOKEN: str | None = None
    TWELVE_DATA_API_KEY: str | None = None
    QUOTES_CACHE_TTL_SECONDS: int = 15 * 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @model_validator(mode="after")
    def _reject_insecure_defaults_in_production(self) -> "Settings":
        """
        Em produção, recusa arrancar com segredos por defeito: é preferível um
        deploy falhado e visível no Render do que JWT assinados com uma chave
        pública ou um convite de registo adivinhável.
        """
        if self.ENVIRONMENT != "production":
            return self
        insecure = [
            name for name, default in _INSECURE_DEFAULTS.items()
            if getattr(self, name) == default
        ]
        if insecure:
            raise ValueError(
                "Variáveis de ambiente obrigatórias em produção com valor por "
                f"defeito: {', '.join(insecure)}. Define-as no Render."
            )
        return self


settings = Settings()
