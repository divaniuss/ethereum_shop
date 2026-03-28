from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class UserSchema(BaseModel):
    wallet_address: str
    nonce: Optional[str] = None
    nonce_created_at: Optional[datetime] = None
    is_admin: bool = False
    username: Optional[str] = None
    shipping_address: Optional[str] = None

class CatalogItem(BaseModel):
    id: str = Field(alias="_id")
    name: str
    description: str
    price_eth: float
    stock_quantity: int
    image_urls: List[str]

class OrderItem(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: float

class OrderSchema(BaseModel):
    id: str = Field(alias="_id")
    wallet_address: str
    items: List[OrderItem]
    total_price: float
    status: str
    shipping_address: str
    tx_hash: Optional[str] = None