"""
Endpoints para automação (cron-job.org), fora da API pública.

Autenticação: header `X-Internal-Token` igual a INTERNAL_CRON_SECRET.
Sem a variável definida, os endpoints respondem 503 (desligados), para
nunca ficarem abertos por esquecimento de configuração.
"""
import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.investment import QuoteSyncAllResult
from app.services.investment_service import sync_all_users_quotes


async def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    secret = settings.INTERNAL_CRON_SECRET
    if not secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Endpoints internos desligados (INTERNAL_CRON_SECRET não definido).")
    # compare_digest: tempo constante, não revela o segredo por timing
    if not x_internal_token or not hmac.compare_digest(x_internal_token.encode(), secret.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token interno inválido.")


router = APIRouter(
    prefix="/internal",
    tags=["Interno"],
    include_in_schema=False,  # não aparece no /docs público
    dependencies=[Depends(require_internal_token)],
)


@router.post("/quotes/sync-all", response_model=QuoteSyncAllResult)
async def sync_all_quotes(db: AsyncSession = Depends(get_db)):
    """Atualiza cotações e snapshots do mês de todos os utilizadores."""
    return await sync_all_users_quotes(db)
