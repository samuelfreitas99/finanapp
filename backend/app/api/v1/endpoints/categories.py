from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
def read_categories(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve categories.
    """
    categories = db.query(Category).filter(Category.user_id == current_user.id).offset(skip).limit(limit).all()
    return categories

@router.post("/", response_model=CategoryResponse)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new category.
    """
    category = Category(
        name=category_in.name,
        type=category_in.type,
        color=category_in.color,
        user_id=current_user.id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{id}", response_model=CategoryResponse)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    category_in: CategoryUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a category.
    """
    category = db.query(Category).filter(Category.id == id, Category.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = category_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(category, field, update_data[field])
        
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{id}", response_model=CategoryResponse)
def delete_category(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a category.
    """
    category = db.query(Category).filter(Category.id == id, Category.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db.delete(category)
    db.commit()
    return category
