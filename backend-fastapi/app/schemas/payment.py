from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class PaymentCreateOrder(BaseModel):
    invoice_id: UUID
    amount: float

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    invoice_id: UUID

class PaymentResponse(BaseModel):
    id: UUID
    invoice_id: UUID
    amount: float
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True
