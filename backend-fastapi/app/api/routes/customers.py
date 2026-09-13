from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import Optional, List
import csv
from io import StringIO
from app.core.database import get_db
from app.api.deps import get_current_business_profile, get_current_user
from app.models.customer import Customer
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    q = select(Customer).where(Customer.business_profile_id == profile.id)
    if search:
        q = q.where(or_(
            Customer.name.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%"),
            Customer.phone.ilike(f"%{search}%")
        ))
    
    res = await db.execute(q.offset(skip).limit(limit))
    items = res.scalars().all()
    return items

@router.post("", response_model=CustomerResponse)
async def create_customer(
    req: CustomerCreate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = req.model_dump(exclude_unset=True)
    if "gst_number" in data and not data.get("gst"):
        data["gst"] = data.pop("gst_number")
    else:
        data.pop("gst_number", None)
    customer = Customer(**data, business_profile_id=profile.id)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    await log_audit("create_customer", current_user.id, profile.id, "customer", customer.id, {})
    return customer

@router.get("/export/csv")
async def export_customers(
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Customer).where(Customer.business_profile_id == profile.id))
    customers = res.scalars().all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Phone", "Email", "Address", "GST", "PAN", "Notes"])
    for c in customers:
        writer.writerow([c.name, c.phone, c.email, c.address, c.gst, c.pan, c.notes])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=customers.csv"})

@router.get("/{id}", response_model=CustomerResponse)
async def get_customer(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Customer).where(Customer.id == id, Customer.business_profile_id == profile.id))
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{id}", response_model=CustomerResponse)
async def update_customer(
    id: str,
    req: CustomerUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    customer = await get_customer(id, profile, db)
    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(customer, key, val)
    await db.commit()
    await db.refresh(customer)
    await log_audit("update_customer", current_user.id, profile.id, "customer", customer.id, update_data)
    return customer

@router.delete("/{id}")
async def delete_customer(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    customer = await get_customer(id, profile, db)
    await db.delete(customer)
    await db.commit()
    await log_audit("delete_customer", current_user.id, profile.id, "customer", id, {})
    return {"detail": "Customer deleted"}
