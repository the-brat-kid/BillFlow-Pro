from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import date
from app.core.database import get_db
from app.api.deps import get_current_business_profile
from app.models.business_profile import BusinessProfile
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.expense import Expense
import csv
from io import StringIO

router = APIRouter()

@router.get("/sales")
async def get_sales_report(
    period: str = Query("monthly"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    q = select(func.sum(Invoice.grand_total), func.count(Invoice.id)).where(Invoice.business_profile_id == profile.id)
    if start_date:
        q = q.where(Invoice.date >= start_date)
    if end_date:
        q = q.where(Invoice.date <= end_date)
    
    res = await db.execute(q)
    revenue, invoice_count = res.first()
    
    # Just a mock aggregation structure as requested
    return {
        "periods": [
            {
                "label": "Total",
                "revenue": revenue or 0.0,
                "invoice_count": invoice_count or 0,
                "expense_total": 0.0 # would need similar aggregation on expenses
            }
        ]
    }

@router.get("/gst")
async def get_gst_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    q = select(InvoiceItem.gst_rate, func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).label("taxable_amount"))        .join(Invoice)        .where(Invoice.business_profile_id == profile.id)        .group_by(InvoiceItem.gst_rate)
        
    if start_date:
        q = q.where(Invoice.date >= start_date)
    if end_date:
        q = q.where(Invoice.date <= end_date)
        
    res = await db.execute(q)
    rows = res.all()
    
    items = []
    total_gst = 0
    for row in rows:
        taxable = row.taxable_amount or 0
        gst_amt = taxable * (row.gst_rate / 100)
        total_gst += gst_amt
        items.append({
            "gst_rate": row.gst_rate,
            "taxable_amount": taxable,
            "gst_amount": gst_amt
        })
        
    return {"total_gst_collected": total_gst, "items": items}

@router.get("/receivables")
async def get_receivables_report(
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    q = select(func.sum(Invoice.grand_total), func.count(Invoice.id)).where(Invoice.business_profile_id == profile.id, Invoice.status != "paid")
    res = await db.execute(q)
    total, count = res.first()
    
    return {
        "total_outstanding": total or 0.0,
        "buckets": [
            {"range": "0-30", "count": count or 0, "total": total or 0.0}
        ]
    }

@router.get("/export")
async def export_report(
    type: str = Query(..., description="sales, gst, receivables"),
    format: str = Query("csv"),
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Report", type])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=report_{type}.csv"})
