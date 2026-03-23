from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from backend.core.dependencies import get_current_user, get_admin_user
from backend.db.database import db

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    tx_hash: Optional[str] = None


@router.post("/")
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="empty items")

    address = order_data.shipping_address or user.get("shipping_address")
    if not address:
        raise HTTPException(status_code=400, detail="address required")

    total_price = 0.0
    processed_items = []

    for item in order_data.items:
        if not ObjectId.is_valid(item.product_id):
            raise HTTPException(status_code=400, detail="invalid id")

        product = await db.catalog.find_one({"_id": ObjectId(item.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="item missing")

        if product["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail="out of stock")

        price = product["price_eth"]
        total_price += price * item.quantity

        processed_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_purchase": price
        })

        await db.catalog.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock_quantity": -item.quantity}}
        )

    new_order = {
        "wallet_address": user["wallet_address"],
        "items": processed_items,
        "total_price": total_price,
        "status": "pending",
        "shipping_address": address,
        "tx_hash": None
    }

    result = await db.orders.insert_one(new_order)
    new_order["_id"] = str(result.inserted_id)

    print("order created")
    return new_order


@router.get("/me")
async def get_my_orders(user: dict = Depends(get_current_user)):
    orders = []
    async for order in db.orders.find({"wallet_address": user["wallet_address"]}):
        order["_id"] = str(order["_id"])
        orders.append(order)
    return orders


@router.patch("/{order_id}")
async def update_order(
        order_id: str,
        update_data: OrderUpdate,
        user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="invalid id")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="order missing")

    update_dict = {}

    if update_data.tx_hash and order["wallet_address"] == user["wallet_address"]:
        update_dict["tx_hash"] = update_data.tx_hash
        update_dict["status"] = "paid"

    if update_data.status and user.get("is_admin"):
        update_dict["status"] = update_data.status

    if not update_dict:
        raise HTTPException(status_code=400, detail="invalid update")

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_dict}
    )

    print("order updated")
    updated_order = await db.orders.find_one({"_id": ObjectId(order_id)})
    updated_order["_id"] = str(updated_order["_id"])
    return updated_order


@router.get("/")
async def get_all_orders(admin: dict = Depends(get_admin_user)):
    orders = []
    async for order in db.orders.find():
        order["_id"] = str(order["_id"])
        orders.append(order)
    return orders