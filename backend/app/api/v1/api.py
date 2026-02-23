from fastapi import APIRouter

from app.api.v1.endpoints import auth
from app.api.v1.endpoints import (
    auth, users, wallets, categories, cards,
    invoices, transactions, debts, reports, installment_plans
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(wallets.router, prefix="/wallets", tags=["wallets"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(cards.router, prefix="/cards", tags=["cards"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(debts.router, prefix="/debts", tags=["debts"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(installment_plans.router, prefix="/installment_plans", tags=["installment_plans"])
