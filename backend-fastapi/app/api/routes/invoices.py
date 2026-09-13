from fastapi import APIRouter, Depends, HTTPException, Query, Response, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List

from app.core.database import get_db
from app.api.deps import get_current_business_profile, get_current_user
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.models.customer import Customer
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceStatusUpdate
from app.services.invoice_service import generate_invoice_number
from app.services.pdf_service import generate_invoice_pdf
from app.services.audit_service import log_audit
from app.services.email_service import send_invoice_email_background

router = APIRouter()

@router.get("", response_model=List[InvoiceResponse])
async def list_invoices(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    q = select(Invoice).where(Invoice.business_profile_id == profile.id).options(selectinload(Invoice.items))
    if status:
        q = q.where(Invoice.status == status)
    if customer_id:
        q = q.where(Invoice.customer_id == customer_id)
    
    res = await db.execute(q.offset(skip).limit(limit))
    items = res.scalars().all()
    return items

@router.post("", response_model=InvoiceResponse)
async def create_invoice(
    req: InvoiceCreate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    invoice_number = await generate_invoice_number(db, profile.id, req.date)
    
    subtotal = 0.0
    gst_total = 0.0
    for item in req.items:
        line_total = item.quantity * item.unit_price
        line_gst = line_total * (item.gst_rate / 100)
        subtotal += line_total
        gst_total += line_gst
        
    grand_total = subtotal + gst_total
    if req.discount_type == "fixed" and req.discount_value:
        grand_total -= req.discount_value
    elif req.discount_type == "percentage" and req.discount_value:
        grand_total -= grand_total * (req.discount_value / 100)

    # Added payment_method and status from the request
    invoice = Invoice(
        business_profile_id=profile.id,
        customer_id=str(req.customer_id),
        invoice_number=invoice_number,
        date=req.date,
        due_date=req.due_date,
        discount_type=req.discount_type,
        discount_value=req.discount_value,
        notes=req.notes,
        terms=req.terms,
        subtotal=subtotal,
        gst_total=gst_total,
        grand_total=grand_total,
        payment_method=req.payment_method,
        status=req.status 
    )
    db.add(invoice)
    await db.flush()

    for item in req.items:
        db_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=str(item.product_id) if item.product_id else None,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_rate=item.gst_rate
        )
        db.add(db_item)
    
    await db.commit()
    await db.refresh(invoice, ["items"])
    await log_audit("create_invoice", current_user.id, profile.id, "invoice", invoice.id, {})
    return invoice

@router.get("/{id}", response_model=InvoiceResponse)
async def get_invoice(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Invoice).where(Invoice.id == id, Invoice.business_profile_id == profile.id).options(selectinload(Invoice.items)))
    invoice = res.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.put("/{id}", response_model=InvoiceResponse)
async def update_invoice(
    id: str,
    req: InvoiceUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    invoice = await get_invoice(id, profile, db)
    update_data = req.model_dump(exclude_unset=True, exclude={"items"})
    for key, val in update_data.items():
        setattr(invoice, key, val)
    await db.commit()
    await db.refresh(invoice, ["items"])
    await log_audit("update_invoice", current_user.id, profile.id, "invoice", invoice.id, update_data)
    return invoice

@router.delete("/{id}")
async def delete_invoice(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    invoice = await get_invoice(id, profile, db)
    await db.delete(invoice)
    await db.commit()
    await log_audit("delete_invoice", current_user.id, profile.id, "invoice", id, {})
    return {"detail": "Invoice deleted"}

@router.patch("/{id}/status")
async def update_invoice_status(
    id: str,
    req: InvoiceStatusUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    invoice = await get_invoice(id, profile, db)
    invoice.status = req.status
    await db.commit()
    await log_audit("update_invoice_status", current_user.id, profile.id, "invoice", id, {"status": req.status})
    return {"detail": "Status updated"}

@router.get("/{id}/pdf")
async def download_invoice_pdf(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Invoice).where(Invoice.id == id, Invoice.business_profile_id == profile.id).options(selectinload(Invoice.items), selectinload(Invoice.customer)))
    invoice = res.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    pdf_buffer = generate_invoice_pdf(invoice, profile, invoice.customer)
    return Response(content=pdf_buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={invoice.invoice_number}.pdf"})


# --- NEW EMAIL ENDPOINT ---
@router.post("/{invoice_id}/send-email")
async def trigger_email(
    invoice_id: str, 
    email: str, 
    background_tasks: BackgroundTasks,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    # Fetch invoice with items and customer loaded
    res = await db.execute(
        select(Invoice)
        .where(Invoice.id == invoice_id, Invoice.business_profile_id == profile.id)
        .options(selectinload(Invoice.items), selectinload(Invoice.customer))
    )
    invoice = res.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Extract real amount and invoice number
    amount = float(invoice.grand_total)
    invoice_number = invoice.invoice_number

    # Generate PDF
    pdf_buffer = generate_invoice_pdf(invoice, profile, invoice.customer)
    pdf_bytes = pdf_buffer.getvalue()

    # Adding to background tasks ensures the API responds immediately.
    # Failures are now logged server-side (see email_service.py) instead of
    # disappearing silently -- check backend logs if an email doesn't arrive.
    background_tasks.add_task(send_invoice_email_background, email, invoice_number, amount, pdf_bytes)

    return {"status": "queued", "message": f"Email to {email} has been queued for sending"}