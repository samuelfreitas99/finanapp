from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from app.models.invoice import InvoiceStatus

class InvoiceBase(BaseModel):
    card_id: UUID
    reference_month: date
    status: InvoiceStatus

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None

class InvoiceResponse(InvoiceBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvoiceWithTotalResponse(InvoiceResponse):
    total_amount: float
