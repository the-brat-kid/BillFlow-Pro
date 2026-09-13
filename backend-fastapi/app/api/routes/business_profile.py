from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_business_profile, get_current_user
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.business_profile import BusinessProfileResponse, BusinessProfileUpdate
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=BusinessProfileResponse)
async def get_profile(profile: BusinessProfile = Depends(get_current_business_profile)):
    return profile

@router.put("", response_model=BusinessProfileResponse)
async def update_profile(
    req: BusinessProfileUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    await db.commit()
    await db.refresh(profile)
    await log_audit("update_profile", current_user.id, profile.id, "business_profile", profile.id, update_data)
    return profile
