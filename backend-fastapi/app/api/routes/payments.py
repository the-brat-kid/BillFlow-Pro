from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_business_profile, get_current_user
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.payment import PaymentCreateOrder, PaymentVerify, PaymentResponse
from app.services.razorpay_service import create_order, verify_signature
from app.services.audit_service import log_audit
from typing import List

router = APIRouter()

@router.post("/create-order")
async def create_payment_order(
    req: PaymentCreateOrder,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify invoice belongs to business
    res = await db.execute(select(Invoice).where(Invoice.id == str(req.invoice_id), Invoice.business_profile_id == profile.id))
    invoice = res.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    order_data = create_order(req.amount, f"Receipt for {invoice.invoice_number}")
    payment = Payment(
        business_profile_id=profile.id,
        invoice_id=invoice.id,
        amount=req.amount,
        razorpay_order_id=order_data.get("id"),
        status="created"
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    await log_audit("create_payment_order", current_user.id, profile.id, "payment", payment.id, {})
    return order_data

@router.post("/verify")
async def verify_payment(
    req: PaymentVerify,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Payment).where(Payment.razorpay_order_id == req.razorpay_order_id, Payment.business_profile_id == profile.id))
    payment = res.scalars().first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if verify_signature(req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature):
        payment.status = "paid"
        payment.razorpay_payment_id = req.razorpay_payment_id
        payment.razorpay_signature = req.razorpay_signature
        
        # update invoice status if needed
        inv_res = await db.execute(select(Invoice).where(Invoice.id == payment.invoice_id))
        invoice = inv_res.scalars().first()
        if invoice:
            invoice.status = "paid"
        
        await db.commit()
        await log_audit("verify_payment", current_user.id, profile.id, "payment", payment.id, {"status": "paid"})
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Invalid signature")

@router.post("/webhook")
async def razorpay_webhook():
    # Placeholder for actual webhook verification
    return {"status": "ok"}

@router.get("/invoice/{invoice_id}", response_model=List[PaymentResponse])
async def get_invoice_payments(
    invoice_id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Payment).where(Payment.invoice_id == invoice_id, Payment.business_profile_id == profile.id))
    return res.scalars().all()
