from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from datetime import date
from app.core.database import get_db
from app.api.deps import get_current_business_profile, get_current_user
from app.models.expense import Expense
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=List[ExpenseResponse])
async def list_expenses(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    q = select(Expense).where(Expense.business_profile_id == profile.id)
    if category:
        q = q.where(Expense.category == category)
    if start_date:
        q = q.where(Expense.date >= start_date)
    if end_date:
        q = q.where(Expense.date <= end_date)
    
    res = await db.execute(q.offset(skip).limit(limit))
    items = res.scalars().all()
    return items

@router.post("", response_model=ExpenseResponse)
async def create_expense(
    req: ExpenseCreate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    expense = Expense(**req.model_dump(), business_profile_id=profile.id)
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    await log_audit("create_expense", current_user.id, profile.id, "expense", expense.id, {})
    return expense

@router.get("/{id}", response_model=ExpenseResponse)
async def get_expense(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Expense).where(Expense.id == id, Expense.business_profile_id == profile.id))
    expense = res.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{id}", response_model=ExpenseResponse)
async def update_expense(
    id: str,
    req: ExpenseUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    expense = await get_expense(id, profile, db)
    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(expense, key, val)
    await db.commit()
    await db.refresh(expense)
    await log_audit("update_expense", current_user.id, profile.id, "expense", expense.id, update_data)
    return expense

@router.delete("/{id}")
async def delete_expense(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    expense = await get_expense(id, profile, db)
    await db.delete(expense)
    await db.commit()
    await log_audit("delete_expense", current_user.id, profile.id, "expense", id, {})
    return {"detail": "Expense deleted"}
