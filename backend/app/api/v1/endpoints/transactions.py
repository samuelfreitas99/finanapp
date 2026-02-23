from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.transaction import Transaction
from app.models.card import Card
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
def read_transactions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    wallet_id: Optional[UUID] = None,
    card_id: Optional[UUID] = None,
    invoice_id: Optional[UUID] = None,
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
) -> Any:
    """
    Retrieve transactions with optional filters.
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if wallet_id:
        query = query.filter(Transaction.wallet_id == wallet_id)
    if card_id:
        query = query.filter(Transaction.card_id == card_id)
    if invoice_id:
        query = query.filter(Transaction.invoice_id == invoice_id)
        
    if start_date and end_date:
        query = query.filter(Transaction.occurred_at >= start_date, Transaction.occurred_at <= end_date)
    elif month and year:
        # Simplificação: Filtro por occurred_at
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1)
        else:
            month_end = date(year, month + 1, 1)
            
        query = query.filter(Transaction.occurred_at >= month_start, Transaction.occurred_at < month_end)

    transactions = query.order_by(Transaction.occurred_at.desc()).offset(skip).limit(limit).all()
    return transactions

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    *,
    db: Session = Depends(deps.get_db),
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new transaction.
    """
    if not transaction_in.wallet_id and not transaction_in.card_id:
        raise HTTPException(status_code=400, detail="Transaction must have a wallet_id or a card_id")

    if transaction_in.type in [TransactionType.income, TransactionType.expense] and not transaction_in.category_id:
        raise HTTPException(status_code=400, detail="category_id is required for income and expense")
    if transaction_in.type == TransactionType.transfer:
        transaction_in.category_id = None

    # Tratamento da Invoice para transações de cartão
    invoice_id = transaction_in.invoice_id
    if transaction_in.card_id and not invoice_id:
        card = db.query(Card).filter(Card.id == transaction_in.card_id).first()
        if card:
            # Determinando reference_month com base no closing_day
            # Se ocorreu no closing_day ou depois, cai na fatura do mês seguinte
            occurred = transaction_in.occurred_at
            if occurred.day >= card.closing_day:
                month = occurred.month % 12 + 1
                year = occurred.year + (1 if occurred.month == 12 else 0)
            else:
                month = occurred.month
                year = occurred.year
            
            ref_month = date(year, month, 1)
            
            # Buscar ou criar invoice
            invoice = db.query(Invoice).filter(
                Invoice.card_id == card.id,
                Invoice.reference_month == ref_month
            ).first()
            
            if not invoice:
                invoice = Invoice(
                    card_id=card.id,
                    reference_month=ref_month,
                    status=InvoiceStatus.open
                )
                db.add(invoice)
                db.flush()
                
            invoice_id = invoice.id

    transaction = Transaction(
        wallet_id=transaction_in.wallet_id,
        category_id=transaction_in.category_id,
        card_id=transaction_in.card_id,
        invoice_id=invoice_id,
        installment_plan_id=transaction_in.installment_plan_id,
        type=transaction_in.type,
        description=transaction_in.description,
        amount=transaction_in.amount,
        occurred_at=transaction_in.occurred_at,
        settled_at=transaction_in.settled_at,
        parent_transaction_id=transaction_in.parent_transaction_id,
        installment_number=transaction_in.installment_number,
        installment_total=transaction_in.installment_total,
        user_id=current_user.id
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.put("/{id}", response_model=TransactionResponse)
def update_transaction(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    transaction_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a transaction.
    """
    transaction = db.query(Transaction).filter(Transaction.id == id, Transaction.user_id == current_user.id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    update_data = transaction_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(transaction, field, update_data[field])

    # Re-avaliação da fatura caso o cartão ou a data de ocorrência tenham mudado
    if transaction.card_id:
        card = db.query(Card).filter(Card.id == transaction.card_id).first()
        if card:
            occurred = transaction.occurred_at
            if occurred.day >= card.closing_day:
                month = occurred.month % 12 + 1
                year = occurred.year + (1 if occurred.month == 12 else 0)
            else:
                month = occurred.month
                year = occurred.year
            ref_month = date(year, month, 1)
            
            invoice = db.query(Invoice).filter(
                Invoice.card_id == card.id,
                Invoice.reference_month == ref_month
            ).first()
            
            if not invoice:
                invoice = Invoice(
                    card_id=card.id,
                    reference_month=ref_month,
                    status=InvoiceStatus.open
                )
                db.add(invoice)
                db.flush()
                
            transaction.invoice_id = invoice.id
    else:
        # Se removeu o cartão, também remove a referência da fatura
        transaction.invoice_id = None
        
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.delete("/{id}", response_model=TransactionResponse)
def delete_transaction(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a transaction.
    """
    transaction = db.query(Transaction).filter(Transaction.id == id, Transaction.user_id == current_user.id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(transaction)
    db.commit()
    return transaction
