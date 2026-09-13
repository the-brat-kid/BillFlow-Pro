from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from app.models.invoice import Invoice
from datetime import date

async def generate_invoice_number(db: AsyncSession, business_profile_id: str, invoice_date: date) -> str:
    year_month = invoice_date.strftime("%Y%m")
    prefix = f"INV-{year_month}-"
    
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(
            Invoice.business_profile_id == business_profile_id,
            extract('year', Invoice.date) == invoice_date.year,
            extract('month', Invoice.date) == invoice_date.month
        )
    )
    count = result.scalar() or 0
    next_num = count + 1
    return f"{prefix}{next_num:04d}"
