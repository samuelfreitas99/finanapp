from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.category import CategoryType

class CategoryBase(BaseModel):
    name: str
    type: CategoryType
    color: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None
    type: Optional[CategoryType] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
