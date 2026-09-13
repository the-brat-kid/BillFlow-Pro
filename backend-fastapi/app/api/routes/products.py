from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import Optional, List
from app.core.database import get_db
from app.api.deps import get_current_business_profile, get_current_user
from app.models.product import Product
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=List[ProductResponse])
async def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock: Optional[bool] = False,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    q = select(Product).where(Product.business_profile_id == profile.id)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if category:
        q = q.where(Product.category == category)
    if low_stock:
        q = q.where(Product.stock_quantity <= Product.reorder_level)
    
    res = await db.execute(q.offset(skip).limit(limit))
    items = res.scalars().all()
    return items

@router.post("", response_model=ProductResponse)
async def create_product(
    req: ProductCreate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = req.model_dump(exclude_unset=True)
    if "stock" in data and "stock_quantity" not in data:
        data["stock_quantity"] = data.pop("stock")
    else:
        data.pop("stock", None)
    if "sku" in data and "hsn_code" not in data:
        data["hsn_code"] = data.pop("sku")
    else:
        data.pop("sku", None)
    if not data.get("unit"):
        data["unit"] = "unit"
    product = Product(**data, business_profile_id=profile.id)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    await log_audit("create_product", current_user.id, profile.id, "product", product.id, {})
    return product

@router.get("/{id}", response_model=ProductResponse)
async def get_product(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Product).where(Product.id == id, Product.business_profile_id == profile.id))
    product = res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{id}", response_model=ProductResponse)
async def update_product(
    id: str,
    req: ProductUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    product = await get_product(id, profile, db)
    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(product, key, val)
    await db.commit()
    await db.refresh(product)
    await log_audit("update_product", current_user.id, profile.id, "product", product.id, update_data)
    return product

@router.delete("/{id}")
async def delete_product(
    id: str,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    product = await get_product(id, profile, db)
    await db.delete(product)
    await db.commit()
    await log_audit("delete_product", current_user.id, profile.id, "product", id, {})
    return {"detail": "Product deleted"}
