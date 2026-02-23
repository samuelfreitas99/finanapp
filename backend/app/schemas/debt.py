from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from app.models.debt import DebtType, DebtStatus

class DebtBase(BaseModel):
    name: str
    type: DebtType
    wallet_id: UUID
    principal_amount: float
    interest_rate: float
    total_installments: int
    start_date: date
    status: DebtStatus

class DebtCreate(DebtBase):
    pass

class DebtUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[DebtStatus] = None

class DebtResponse(DebtBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DebtFixedCreate(BaseModel):
    name: str
    wallet_id: UUID
    start_date: date
    total_amount: Optional[float] = None
    installment_value: Optional[float] = None
    total_installments: int
    
class DebtInstallmentResponse(BaseModel):
    id: UUID
    debt_id: UUID
    installment_number: int
    due_date: date
    principal_component: Optional[float] = None
    interest_component: Optional[float] = None
    total_amount: float
    paid: bool
    paid_transaction_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True
