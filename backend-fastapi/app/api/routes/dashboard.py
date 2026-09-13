from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.api.deps import get_current_business_profile
from app.models.business_profile import BusinessProfile
from app.models.invoice import Invoice, InvoiceStatus
from app.models.customer import Customer
from app.models.product import Product
from app.models.payment import Payment

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    # Total Revenue (sum of grand total of paid invoices)
    rev_res = await db.execute(select(func.sum(Invoice.grand_total)).where(Invoice.business_profile_id == profile.id, Invoice.status == InvoiceStatus.paid))
    total_revenue = rev_res.scalar() or 0.0

    # Counts
    inv_res = await db.execute(select(func.count(Invoice.id)).where(Invoice.business_profile_id == profile.id))
    total_invoices = inv_res.scalar() or 0

    cust_res = await db.execute(select(func.count(Customer.id)).where(Customer.business_profile_id == profile.id))
    total_customers = cust_res.scalar() or 0

    prod_res = await db.execute(select(func.count(Product.id)).where(Product.business_profile_id == profile.id))
    total_products = prod_res.scalar() or 0
    
    # Invoice status breakdown
    paid_res = await db.execute(select(func.count(Invoice.id)).where(Invoice.business_profile_id == profile.id, Invoice.status == InvoiceStatus.paid))
    paid_invoices = paid_res.scalar() or 0
    
    unpaid_res = await db.execute(select(func.count(Invoice.id)).where(Invoice.business_profile_id == profile.id, Invoice.status == InvoiceStatus.unpaid))
    unpaid_invoices = unpaid_res.scalar() or 0

    overdue_res = await db.execute(select(func.count(Invoice.id)).where(Invoice.business_profile_id == profile.id, Invoice.status == InvoiceStatus.overdue))
    overdue_invoices = overdue_res.scalar() or 0

    return {
        "total_revenue": total_revenue,
        "total_invoices": total_invoices,
        "total_customers": total_customers,
        "total_products": total_products,
        "paid_invoices": paid_invoices,
        "unpaid_invoices": unpaid_invoices,
        "overdue_invoices": overdue_invoices
    }

@router.get("/recent-transactions")
async def get_recent_transactions(
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    # We'll use recent invoices for this, joining with customer
    res = await db.execute(
        select(Invoice, Customer.name)
        .join(Customer, Invoice.customer_id == Customer.id)
        .where(Invoice.business_profile_id == profile.id)
        .order_by(desc(Invoice.created_at))
        .limit(10)
    )
    items = res.all()
    transactions = []
    for inv, customer_name in items:
        transactions.append({
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "customer_name": customer_name,
            "amount": inv.grand_total,
            "status": inv.status,
            "date": inv.date
        })
    return transactions
