from sqlalchemy import Column, String, Integer, Numeric, Date, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class Transaction(Base):
    __tablename__ = "transactions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=True) # Nullable only if card_id is present
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    installment_plan_id = Column(UUID(as_uuid=True), ForeignKey("installment_plans.id"), nullable=True)
    
    type = Column(Enum(TransactionType), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    
    # Caixa vs Competência
    occurred_at = Column(Date, nullable=False) # Competência
    settled_at = Column(Date, nullable=True)   # Caixa (se null, é pendente/estimativa)
    
    parent_transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
    installment_number = Column(Integer, nullable=True)
    installment_total = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="transactions")
    wallet = relationship("Wallet", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    card = relationship("Card", back_populates="transactions")
    invoice = relationship("Invoice", back_populates="transactions")
    installment_plan = relationship("InstallmentPlan", back_populates="transactions")
    parent_transaction = relationship("Transaction", remote_side="Transaction.id")
