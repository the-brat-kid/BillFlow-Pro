from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.api.deps import get_current_user, get_current_business_profile
from app.models.user import User
from app.models.business_profile import BusinessProfile
from app.schemas.auth import TokenResponse, LoginRequest, RefreshRequest
from app.schemas.user import UserCreate
from jose import jwt, JWTError
from app.core.config import settings
from app.services.audit_service import log_audit

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        phone=user_in.phone
    )
    db.add(user)
    await db.flush()

    profile = BusinessProfile(
        user_id=user.id,
        business_name=user_in.business_name,
        business_type=user_in.business_type,
        upi_id=user_in.upi_id,
        gst_number=user_in.gst_number,
        address=user_in.address
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    await db.refresh(profile)

    access_token = create_access_token(user.id, profile.id)
    refresh_token = create_refresh_token(user.id, profile.id)
    
    await log_audit("register", user.id, profile.id, "user", user.id, {})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "business_profile": profile
    }

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    prof_res = await db.execute(select(BusinessProfile).where(BusinessProfile.user_id == user.id))
    profile = prof_res.scalars().first()

    access_token = create_access_token(user.id, profile.id if profile else None)
    refresh_token = create_refresh_token(user.id, profile.id if profile else None)

    await log_audit("login", user.id, profile.id if profile else None, "user", user.id, {})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "business_profile": profile
    }

@router.post("/refresh")
async def refresh_token(req: RefreshRequest):
    try:
        payload = jwt.decode(req.refresh_token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        bp_id = payload.get("business_profile_id")
        return {
            "access_token": create_access_token(user_id, bp_id),
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    profile: BusinessProfile = Depends(get_current_business_profile)
):
    return {"user": current_user, "business_profile": profile}
