import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import CategoryKind


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    kind: CategoryKind
    icon: Optional[str] = Field(default=None, max_length=40)
    color: Optional[str] = Field(default=None, max_length=20)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    kind: Optional[CategoryKind] = None
    icon: Optional[str] = Field(default=None, max_length=40)
    color: Optional[str] = Field(default=None, max_length=20)


class CategoryRead(CategoryBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)
