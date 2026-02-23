from pydantic import BaseModel
from typing import List
from uuid import UUID

class CategorySummary(BaseModel):
    category_id: UUID
    category_name: str
    total_amount: float
    
class ReportResponse(BaseModel):
    month: int
    year: int
    view_type: str # 'cash' or 'accrual'
    total_income: float
    total_expense: float
    net_balance: float
    expenses_by_category: List[CategorySummary]

class ForecastMonth(BaseModel):
    month: int
    year: int
    total_income: float
    total_expense: float
    net_balance: float
    breakdown_debts: float = 0.0
    breakdown_installments: float = 0.0
    breakdown_recurring: float = 0.0

class ForecastResponse(BaseModel):
    months: List[ForecastMonth]
