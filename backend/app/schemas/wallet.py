from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.wallet import WalletType

class WalletBase(BaseModel):
    name: str
    type: WalletType
    is_archived: bool = False

class WalletCreate(WalletBase):
    pass

class WalletUpdate(WalletBase):
    name: Optional[str] = None
    type: Optional[WalletType] = None

class WalletResponse(WalletBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WalletWithBalanceResponse(WalletResponse):
    projected_balance: float
    # Em um banco postgres REAL os agregados vem como Decimal,
    # O pydantic converte Decimal para float/string quando especificado.
