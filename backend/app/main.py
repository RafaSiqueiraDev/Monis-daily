import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.routers import (
    auth,
    categories,
    incomes,
    daily_expenses,
    recurring_bills,
    bill_instances,
    credit_cards,
    dashboard,
    investments,
)

app = FastAPI(title=settings.PROJECT_NAME)

# Lista base de origens permitidas
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://monis-daily-ashen.vercel.app",
]

# Lê origens adicionais da variável de ambiente CORS_ORIGINS se existir
cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    origins.extend([o.strip() for o in cors_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão direta dos routers
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(incomes.router)
app.include_router(daily_expenses.router)
app.include_router(recurring_bills.router)
app.include_router(bill_instances.router)
app.include_router(credit_cards.router)
app.include_router(dashboard.router)
app.include_router(investments.router)


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "ok"
    try:
        # Query mínima só para "acordar" o compute do Neon e confirmar
        # que a ligação está viva — sem tocar em nenhuma tabela real.
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unreachable"

    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "project": settings.PROJECT_NAME,
        "database": db_status,
    }
