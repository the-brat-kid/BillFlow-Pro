from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

class InvoiceItemBase(BaseModel):
    product_id: Optional[str] = None
    description: str
    quantity: int
    unit_price: float
    gst_rate: float

class InvoiceItemResponse(InvoiceItemBase):
    id: str
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    customer_id: str
    date: date
    due_date: Optional[date] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    notes: Optional[str] = None
    terms: Optional[str] = None

    @field_validator('date', 'due_date', mode='before')
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemBase]
    payment_method: Optional[str] = None
    status: Optional[str] = None

class InvoiceUpdate(InvoiceBase):
    payment_method: Optional[str] = None
    status: Optional[str] = None

class InvoiceStatusUpdate(BaseModel):
    status: str

class InvoiceResponse(InvoiceBase):
    id: str
    invoice_number: str
    subtotal: float
    gst_total: float
    grand_total: float
    status: str
    payment_method: Optional[str] = None
    created_at: datetime
    items: List[InvoiceItemResponse] = []
    
    class Config:
        from_attributes = True