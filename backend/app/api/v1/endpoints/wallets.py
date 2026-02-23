from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.api import deps
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.schemas.wallet import (
    WalletCreate,
    WalletUpdate,
    WalletResponse,
    WalletWithBalanceResponse,
)
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()


@router.get("/", response_model=List[WalletWithBalanceResponse])
def read_wallets(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    wallets = (
        db.query(Wallet)
        .filter(Wallet.user_id == current_user.id, Wallet.is_archived == False)
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for wallet in wallets:
        balance_stmt = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.wallet_id == wallet.id,
                Transaction.settled_at != None,  # apenas liquidadas
            )
            .scalar()
            or 0.0
        )

        results.append(
            {
                "id": wallet.id,
                "user_id": wallet.user_id,
                "name": wallet.name,
                "type": wallet.type,
                "created_at": wallet.created_at,
                "updated_at": wallet.updated_at,
                "projected_balance": float(balance_stmt),
            }
        )

    return results


@router.post("/", response_model=WalletResponse, status_code=status.HTTP_201_CREATED)
def create_wallet(
    *,
    db: Session = Depends(deps.get_db),
    wallet_in: WalletCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    wallet = Wallet(name=wallet_in.name, type=wallet_in.type, user_id=current_user.id)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.put("/{id}", response_model=WalletResponse)
def update_wallet(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,  # ✅ UUID (não str)
    wallet_in: WalletUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    wallet = (
        db.query(Wallet)
        .filter(Wallet.id == id, Wallet.user_id == current_user.id)
        .first()
    )
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    update_data = wallet_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(wallet, field, value)

    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wallet(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,  # ✅ UUID (não str)
    current_user: User = Depends(get_current_user),
) -> None:
    wallet = (
        db.query(Wallet)
        .filter(Wallet.id == id, Wallet.user_id == current_user.id)
        .first()
    )
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    wallet.is_archived = True
    db.add(wallet)
    db.commit()
    return