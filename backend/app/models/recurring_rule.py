from sqlalchemy import Column, String, Numeric, Date, Enum, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base
from app.models.transaction import TransactionType

class RecurringFrequency(str, enum.Enum):
    monthly = "monthly"
    weekly = "weekly"
    yearly = "yearly"

class RecurringRule(Base):
    __tablename__ = "recurring_rules"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=True)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    
    description = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    frequency = Column(Enum(RecurringFrequency), nullable=False, default=RecurringFrequency.monthly)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    
    last_generated_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="recurring_rules")
    wallet = relationship("Wallet")
    card = relationship("Card")
    category = relationship("Category")
