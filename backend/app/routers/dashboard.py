from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryRead
from app.services.dashboard_service import get_month_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryRead)
async def get_dashboard_summary(
    reference_month: date = Query(
        default_factory=lambda: date.today().replace(day=1),
        description="Mês de referência (ex: 2026-10-01)"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna o resumo financeiro consolidado do mês para montagem do Dashboard.
    """
    return await get_month_summary(db, current_user.id, reference_month)
