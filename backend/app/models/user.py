from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relações
    wallets = relationship("Wallet", back_populates="owner")
    categories = relationship("Category", back_populates="owner")
    cards = relationship("Card", back_populates="owner")
    installment_plans = relationship("InstallmentPlan", back_populates="owner")
    debts = relationship("Debt", back_populates="owner")
    transactions = relationship("Transaction", back_populates="owner")
    recurring_rules = relationship("RecurringRule", back_populates="owner")
