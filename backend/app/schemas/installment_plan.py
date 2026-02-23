from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class InstallmentPlanBase(BaseModel):
    wallet_id: Optional[UUID] = None
    card_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    description: str
    total_amount: float
    installment_count: int
    start_date: date

class InstallmentPlanCreate(InstallmentPlanBase):
    pass

class InstallmentPlanResponse(InstallmentPlanBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
