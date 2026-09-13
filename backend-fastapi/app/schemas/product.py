from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = "unit"
    price: float
    cost_price: Optional[float] = None
    gst_rate: int = 18
    hsn_code: Optional[str] = None
    stock_quantity: Optional[int] = 0
    reorder_level: Optional[int] = None
    stock: Optional[int] = None
    sku: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str
    class Config:
        from_attributes = True
