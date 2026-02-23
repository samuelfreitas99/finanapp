from sqlalchemy import Column, Integer, Numeric, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class DebtInstallment(Base):
    __tablename__ = "debt_installments"

    debt_id = Column(UUID(as_uuid=True), ForeignKey("debts.id"), nullable=False, index=True)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    principal_component = Column(Numeric(14, 2), nullable=True) # Nullable for 'fixed' debt types
    interest_component = Column(Numeric(14, 2), nullable=True)  # Nullable for 'fixed' debt types
    total_amount = Column(Numeric(14, 2), nullable=False)
    paid = Column(Boolean, default=False, nullable=False)
    paid_transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    debt = relationship("Debt", back_populates="installments")
    # Usa string "Transaction" para evitar import circular 
    paid_transaction = relationship("Transaction", foreign_keys=[paid_transaction_id])
