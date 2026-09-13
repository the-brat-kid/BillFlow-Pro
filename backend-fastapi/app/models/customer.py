import uuid
from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import mapped_column, Mapped
from app.core.database import Base
from sqlalchemy.dialects.postgresql import UUID

class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id: Mapped[str] = mapped_column(String, ForeignKey("business_profiles.id"), index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    gst: Mapped[str] = mapped_column(String, nullable=True)
    pan: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    @property
    def gst_number(self):
        return self.gst
