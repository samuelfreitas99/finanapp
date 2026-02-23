from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.card import Card
from app.schemas.card import CardCreate, CardUpdate, CardResponse
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CardResponse])
def read_cards(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve cards.
    """
    cards = db.query(Card).filter(Card.user_id == current_user.id).offset(skip).limit(limit).all()
    return cards

@router.post("/", response_model=CardResponse)
def create_card(
    *,
    db: Session = Depends(deps.get_db),
    card_in: CardCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new card.
    """
    card = Card(
        name=card_in.name,
        wallet_id=card_in.wallet_id,
        closing_day=card_in.closing_day,
        due_day=card_in.due_day,
        limit=card_in.limit,
        user_id=current_user.id
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@router.put("/{id}", response_model=CardResponse)
def update_card(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    card_in: CardUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a card.
    """
    card = db.query(Card).filter(Card.id == id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    update_data = card_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(card, field, update_data[field])
        
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@router.delete("/{id}", response_model=CardResponse)
def delete_card(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a card.
    """
    card = db.query(Card).filter(Card.id == id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    db.delete(card)
    db.commit()
    return card
