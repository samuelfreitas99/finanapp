from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.installment_plan import InstallmentPlan
from app.models.transaction import Transaction, TransactionType
from app.models.card import Card
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.installment_plan import InstallmentPlanCreate, InstallmentPlanResponse
from app.api.v1.endpoints.users import get_current_user

import calendar

router = APIRouter()

def add_months(start_date: date, months_to_add: int) -> date:
    month = start_date.month - 1 + months_to_add
    year = start_date.year + month // 12
    month = month % 12 + 1
    day = min(start_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

def get_or_create_invoice(db: Session, card_id: UUID, occurred: date) -> UUID:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        return None
        
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
        
    return invoice.id


@router.post("/", response_model=InstallmentPlanResponse)
def create_installment_plan(
    *,
    db: Session = Depends(deps.get_db),
    plan_in: InstallmentPlanCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    
    if not plan_in.wallet_id and not plan_in.card_id:
        raise HTTPException(status_code=400, detail="Must provide wallet_id or card_id")
        
    if plan_in.installment_count <= 0:
        raise HTTPException(status_code=400, detail="Installment count must be greater than 0")

    plan = InstallmentPlan(
        user_id=current_user.id,
        wallet_id=plan_in.wallet_id,
        card_id=plan_in.card_id,
        description=plan_in.description,
        total_amount=plan_in.total_amount,
        installment_count=plan_in.installment_count,
        start_date=plan_in.start_date
    )
    db.add(plan)
    db.flush()
    
    calc_total_amount = Decimal(str(plan_in.total_amount))
    calc_installment_value = round(calc_total_amount / plan_in.installment_count, 2)
    
    running_total = Decimal("0.0")
    for i in range(1, plan_in.installment_count + 1):
        if i == plan_in.installment_count:
            current_installment_val = calc_total_amount - running_total
        else:
            current_installment_val = calc_installment_value
            
        running_total += current_installment_val
        
        occurred = add_months(plan_in.start_date, i - 1)
        invoice_id = None
        
        if plan_in.card_id:
            invoice_id = get_or_create_invoice(db, plan_in.card_id, occurred)

        tx = Transaction(
            user_id=current_user.id,
            wallet_id=plan_in.wallet_id,
            card_id=plan_in.card_id,
            category_id=plan_in.category_id,
            invoice_id=invoice_id,
            installment_plan_id=plan.id,
            type=TransactionType.expense, # Assume parcelamento é sempre despesa, se necessário alterar adicione "type" no modelo InstallmentPlan
            description=f"{plan_in.description} ({i}/{plan_in.installment_count})",
            amount=-abs(current_installment_val), # É negativo na tabela transactions
            occurred_at=occurred,
            settled_at=occurred if not plan_in.card_id else None,
            installment_number=i,
            installment_total=plan_in.installment_count
        )
        db.add(tx)
        
    db.commit()
    db.refresh(plan)
    return plan
