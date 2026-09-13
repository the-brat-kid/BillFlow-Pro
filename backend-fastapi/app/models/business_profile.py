import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from app.core.database import Base
from sqlalchemy.dialects.postgresql import UUID

class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True)
    business_name: Mapped[str] = mapped_column(String, nullable=False)
    business_type: Mapped[str] = mapped_column(String, nullable=False)
    upi_id: Mapped[str] = mapped_column(String, nullable=True)
    gst_number: Mapped[str] = mapped_column(String, nullable=True)
    address: Mapped[str] = mapped_column(String, nullable=True)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    logo_base64: Mapped[str] = mapped_column(String, nullable=True)
