from sqlalchemy import Column, Date, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class InvoiceStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    paid = "paid"

class Invoice(Base):
    __tablename__ = "invoices"

    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False, index=True)
    reference_month = Column(Date, nullable=False) # Always YYYY-MM-01
    status = Column(Enum(InvoiceStatus), nullable=False, default=InvoiceStatus.open)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    card = relationship("Card", back_populates="invoices")
    transactions = relationship("Transaction", back_populates="invoice")
