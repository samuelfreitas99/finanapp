from sqlalchemy import Column, String, Integer, Numeric, Date, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class DebtType(str, enum.Enum):
    fixed = "fixed"
    price = "price"
    sac = "sac"
    custom = "custom"

class DebtStatus(str, enum.Enum):
    active = "active"
    finished = "finished"
    cancelled = "cancelled"

class Debt(Base):
    __tablename__ = "debts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(Enum(DebtType), nullable=False)
    principal_amount = Column(Numeric(14, 2), nullable=False)
    interest_rate = Column(Numeric(8, 4), nullable=True) # Pode ser nulo para debts tipo fixed
    total_installments = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    status = Column(Enum(DebtStatus), nullable=False, default=DebtStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="debts")
    wallet = relationship("Wallet", back_populates="debts")
    installments = relationship("DebtInstallment", back_populates="debt", cascade="all, delete-orphan")


