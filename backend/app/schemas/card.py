from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class CardBase(BaseModel):
    name: str
    wallet_id: Optional[UUID] = None
    closing_day: int
    due_day: int
    limit: float

class CardCreate(CardBase):
    pass

class CardUpdate(CardBase):
    name: Optional[str] = None
    wallet_id: Optional[UUID] = None
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    limit: Optional[float] = None

class CardResponse(CardBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
