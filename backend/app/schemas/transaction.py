from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from app.models.transaction import TransactionType

class TransactionBase(BaseModel):
    wallet_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    card_id: Optional[UUID] = None
    invoice_id: Optional[UUID] = None
    installment_plan_id: Optional[UUID] = None
    type: TransactionType
    description: str
    amount: float
    occurred_at: date
    settled_at: Optional[date] = None
    parent_transaction_id: Optional[UUID] = None
    installment_number: Optional[int] = None
    installment_total: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    wallet_id: Optional[UUID] = None
    card_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    type: Optional[TransactionType] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    occurred_at: Optional[date] = None
    settled_at: Optional[date] = None

class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
