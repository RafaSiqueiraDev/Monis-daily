from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão direta dos routers (os prefixos e tags já estão definidos em cada submódulo)
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
async def health_check():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "project": settings.PROJECT_NAME,
    }
