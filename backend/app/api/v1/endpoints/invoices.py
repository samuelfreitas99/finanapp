from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.models.card import Card
from app.models.wallet import Wallet
from app.models.transaction import Transaction, TransactionType
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceWithTotalResponse
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()

@router.get("/", response_model=List[InvoiceWithTotalResponse])
def read_invoices(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve invoices and their totals based on associated transactions.
    """
    invoices = (
        db.query(Invoice)
        .join(Card)
        .filter(Card.user_id == current_user.id)
        .offset(skip).limit(limit).all()
    )
    
    results = []
    for invoice in invoices:
        total = db.query(func.sum(Transaction.amount)).filter(
            Transaction.invoice_id == invoice.id
        ).scalar() or 0.0

        invoice_dict = {
            "id": invoice.id,
            "card_id": invoice.card_id,
            "reference_month": invoice.reference_month,
            "status": invoice.status,
            "created_at": invoice.created_at,
            "updated_at": invoice.updated_at,
            "total_amount": float(total)
        }
        results.append(invoice_dict)
        
    return results

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    *,
    db: Session = Depends(deps.get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a new invoice manually (Optional, usually generated automatically).
    """
    # Verify card ownership
    card = db.query(Card).filter(Card.id == invoice_in.card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    invoice = Invoice(
        card_id=invoice_in.card_id,
        reference_month=invoice_in.reference_month,
        status=invoice_in.status
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/{id}", response_model=InvoiceWithTotalResponse)
def get_invoice(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get invoice details by ID.
    """
    invoice = db.query(Invoice).join(Card).filter(
        Invoice.id == id, Card.user_id == current_user.id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    total = db.query(func.sum(Transaction.amount)).filter(
        Transaction.invoice_id == invoice.id
    ).scalar() or 0.0

    return {
        "id": invoice.id,
        "card_id": invoice.card_id,
        "reference_month": invoice.reference_month,
        "status": invoice.status,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
        "total_amount": float(total)
    }

@router.put("/{id}/pay", response_model=InvoiceResponse)
def pay_invoice(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    wallet_id: UUID,
    payment_date: str, # Formato YYYY-MM-DD
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Pay an invoice. Generates an expense transaction in the selected wallet.
    """
    invoice = db.query(Invoice).join(Card).filter(
        Invoice.id == id, Card.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    # Verify wallet ownership
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    # Calcular o valor total da fatura
    total_amount = db.query(func.sum(Transaction.amount)).filter(
        Transaction.invoice_id == invoice.id
    ).scalar() or 0.0
    
    if total_amount > 0:
        # Criar transação de despesa na wallet
        payment_tx = Transaction(
            user_id=current_user.id,
            wallet_id=wallet.id,
            amount=-abs(total_amount), # Saída na wallet
            type=TransactionType.expense,
            description=f"Pagamento Fatura {invoice.card.name} - {invoice.reference_month.strftime('%m/%Y')}",
            occurred_at=payment_date, # Competência é hoje/dia pago
            settled_at=payment_date,  # Impacta o caixa hoje/dia pago
        )
        db.add(payment_tx)

    # Marcar fatura como paga
    invoice.status = InvoiceStatus.paid
    db.commit()
    db.refresh(invoice)
    return invoice
