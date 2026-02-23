from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class Card(Base):
    __tablename__ = "cards"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    # The default wallet where the invoice will be paid
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=True) 
    name = Column(String, nullable=False)
    closing_day = Column(Integer, nullable=False)
    due_day = Column(Integer, nullable=False)
    limit = Column(Numeric(14, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="cards")
    wallet = relationship("Wallet", back_populates="cards")
    invoices = relationship("Invoice", back_populates="card")
    installment_plans = relationship("InstallmentPlan", back_populates="card")
    transactions = relationship("Transaction", back_populates="card")
