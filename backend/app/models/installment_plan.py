from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class InstallmentPlan(Base):
    __tablename__ = "installment_plans"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=True)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=True)
    description = Column(String, nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    installment_count = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="installment_plans")
    wallet = relationship("Wallet", back_populates="installment_plans")
    card = relationship("Card", back_populates="installment_plans")
    transactions = relationship("Transaction", back_populates="installment_plan")
