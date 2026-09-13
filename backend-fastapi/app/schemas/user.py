from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    business_name: str
    business_type: str
    upi_id: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    class Config:
        from_attributes = True
