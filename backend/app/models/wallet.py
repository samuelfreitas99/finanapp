from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class WalletType(str, enum.Enum):
    bank_account = "bank_account"
    cash = "cash"
    digital_wallet = "digital_wallet"

class Wallet(Base):
    __tablename__ = "wallets"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(WalletType), nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="wallets")
    cards = relationship("Card", back_populates="wallet")
    installment_plans = relationship("InstallmentPlan", back_populates="wallet")
    debts = relationship("Debt", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet")
