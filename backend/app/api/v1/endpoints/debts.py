from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from uuid import UUID
import calendar

from app.api import deps
from app.models.user import User
from app.models.debt import Debt, DebtType, DebtStatus
from app.models.debt_installment import DebtInstallment
from app.models.wallet import Wallet
from app.models.transaction import Transaction, TransactionType
from app.schemas.debt import DebtFixedCreate, DebtResponse, DebtInstallmentResponse, DebtUpdate
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()


def add_months(start_date: date, months_to_add: int) -> date:
    month = start_date.month - 1 + months_to_add
    year = start_date.year + month // 12
    month = month % 12 + 1
    day = min(start_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


@router.get("/", response_model=List[DebtResponse])
def read_debts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    debts = (
        db.query(Debt)
        .filter(Debt.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return debts


@router.post("/fixed", response_model=DebtResponse)
def create_fixed_debt(
    *,
    db: Session = Depends(deps.get_db),
    debt_in: DebtFixedCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    wallet = (
        db.query(Wallet)
        .filter(Wallet.id == debt_in.wallet_id, Wallet.user_id == current_user.id)
        .first()
    )
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    if debt_in.total_amount is None and debt_in.installment_value is None:
        raise HTTPException(
            status_code=400,
            detail="Must provide either total_amount or installment_value",
        )

    if debt_in.installment_value is not None:
        calc_installment_value = Decimal(str(debt_in.installment_value))
        calc_total_amount = calc_installment_value * debt_in.total_installments
    else:
        calc_total_amount = Decimal(str(debt_in.total_amount))
        calc_installment_value = (calc_total_amount / debt_in.total_installments).quantize(Decimal("0.01"))

    debt = Debt(
        name=debt_in.name,
        type=DebtType.fixed,
        wallet_id=debt_in.wallet_id,
        principal_amount=calc_total_amount,
        interest_rate=0.0,
        total_installments=debt_in.total_installments,
        start_date=debt_in.start_date,
        status=DebtStatus.active,
        user_id=current_user.id,
    )
    db.add(debt)
    db.flush()  # pega debt.id sem commit

    running_total = Decimal("0.0")
    for i in range(1, debt_in.total_installments + 1):
        due_date = add_months(debt_in.start_date, i - 1)

        if i == debt_in.total_installments:
            current_installment_val = calc_total_amount - running_total
        else:
            current_installment_val = calc_installment_value

        running_total += current_installment_val

        installment = DebtInstallment(
            debt_id=debt.id,
            installment_number=i,
            due_date=due_date,
            principal_component=None,
            interest_component=None,
            total_amount=current_installment_val,
            paid=False,
        )
        db.add(installment)

    db.commit()
    db.refresh(debt)
    return debt


@router.get("/{id}", response_model=DebtResponse)
def get_debt(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    debt = (
        db.query(Debt)
        .filter(Debt.id == id, Debt.user_id == current_user.id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    return debt


@router.put("/{id}", response_model=DebtResponse)
def update_debt(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    debt_in: DebtUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    debt = (
        db.query(Debt)
        .filter(Debt.id == id, Debt.user_id == current_user.id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")

    if debt_in.name is not None:
        debt.name = debt_in.name
    if debt_in.status is not None:
        debt.status = debt_in.status

    db.commit()
    db.refresh(debt)
    return debt


@router.get("/{id}/installments", response_model=List[DebtInstallmentResponse])
def get_debt_installments(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    debt = (
        db.query(Debt)
        .filter(Debt.id == id, Debt.user_id == current_user.id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")

    # garante ordenação estável
    installments = (
        db.query(DebtInstallment)
        .filter(DebtInstallment.debt_id == debt.id)
        .order_by(DebtInstallment.installment_number.asc())
        .all()
    )
    return installments


@router.put(
    "/{debt_id}/installments/{installment_id}/pay",
    response_model=DebtInstallmentResponse,
)
def pay_debt_installment(
    *,
    db: Session = Depends(deps.get_db),
    debt_id: UUID,
    installment_id: UUID,
    payment_date: date = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
) -> Any:
    debt = (
        db.query(Debt)
        .filter(Debt.id == debt_id, Debt.user_id == current_user.id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")

    installment = (
        db.query(DebtInstallment)
        .filter(DebtInstallment.id == installment_id, DebtInstallment.debt_id == debt.id)
        .first()
    )
    if not installment:
        raise HTTPException(status_code=404, detail="Installment not found")

    if installment.paid:
        raise HTTPException(status_code=400, detail="Installment is already paid")

    payment_tx = Transaction(
        user_id=current_user.id,
        wallet_id=debt.wallet_id,
        amount=-abs(float(installment.total_amount)),
        type=TransactionType.expense,
        description=f"Pagamento Parcela {installment.installment_number}/{debt.total_installments} - {debt.name}",
        occurred_at=payment_date,
        settled_at=payment_date,
    )
    db.add(payment_tx)
    db.flush()

    installment.paid = True
    installment.paid_transaction_id = payment_tx.id
    db.commit()
    db.refresh(installment)

    all_paid = (
        db.query(DebtInstallment)
        .filter(DebtInstallment.debt_id == debt.id, DebtInstallment.paid == False)  # noqa: E712
        .count()
        == 0
    )
    if all_paid:
        debt.status = DebtStatus.finished
        db.commit()

    return installment

@router.put(
    "/{debt_id}/installments/{installment_id}/unpay",
    response_model=DebtInstallmentResponse,
)
def unpay_debt_installment(
    *,
    db: Session = Depends(deps.get_db),
    debt_id: UUID,
    installment_id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    debt = (
        db.query(Debt)
        .filter(Debt.id == debt_id, Debt.user_id == current_user.id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")

    installment = (
        db.query(DebtInstallment)
        .filter(DebtInstallment.id == installment_id, DebtInstallment.debt_id == debt.id)
        .first()
    )
    if not installment:
        raise HTTPException(status_code=404, detail="Installment not found")

    if not installment.paid:
        raise HTTPException(status_code=400, detail="Installment is not paid yet")

    if installment.paid_transaction_id:
        payment_tx = db.query(Transaction).filter(Transaction.id == installment.paid_transaction_id).first()
        if payment_tx:
            db.delete(payment_tx)

    installment.paid = False
    installment.paid_transaction_id = None
    
    if debt.status == DebtStatus.finished:
        debt.status = DebtStatus.active

    db.commit()
    db.refresh(installment)

    return installment