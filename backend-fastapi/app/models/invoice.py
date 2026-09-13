import uuid
from datetime import datetime, date
from sqlalchemy import String, ForeignKey, Float, Date, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.core.database import Base
import enum

class InvoiceStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"
    partial = "partial"
    overdue = "overdue"

class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = {'extend_existing': True} # Safety ke liye add kiya hai
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_profile_id: Mapped[str] = mapped_column(String, ForeignKey("business_profiles.id"), index=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), index=True)
    invoice_number: Mapped[str] = mapped_column(String, nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    discount_type: Mapped[str] = mapped_column(String, nullable=True)
    discount_value: Mapped[float] = mapped_column(Float, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    terms: Mapped[str] = mapped_column(Text, nullable=True)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    gst_total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    grand_total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String, default=InvoiceStatus.unpaid.value)
    
    payment_method: Mapped[str] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    items: Mapped[list["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    customer: Mapped["Customer"] = relationship("Customer")