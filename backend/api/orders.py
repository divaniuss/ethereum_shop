from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from web3 import Web3
from decimal import Decimal
from pymongo.errors import DuplicateKeyError
from backend.core.dependencies import get_current_user, get_admin_user
from backend.db.database import db

router = APIRouter(prefix="/orders", tags=["orders"])

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))

CONTRACT_ADDRESS = w3.to_checksum_address("0xCA406a4678d0BEc8b7C4bcF18bAA9A9859d947C8")


CONTRACT_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "buyer", "type": "address"},
            {"indexed": False, "internalType": "string", "name": "orderId", "type": "string"},
            {"indexed": False, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "OrderPaid",
        "type": "event"
    }
]


contract_instance = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


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

    total_price_decimal = Decimal("0.0")
    processed_items = []
    successful_deductions = []

    for item in order_data.items:
        if not ObjectId.is_valid(item.product_id):
            raise HTTPException(status_code=400, detail="invalid id")

        product = await db.catalog.find_one({"_id": ObjectId(item.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="item missing")

        if product["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail="out of stock")

        price_dec = Decimal(str(product["price_eth"]))
        total_price_decimal += price_dec * item.quantity

        processed_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_purchase": str(price_dec)
        })

    try:
        for item in processed_items:
            update_result = await db.catalog.update_one(
                {
                    "_id": ObjectId(item["product_id"]),
                    "stock_quantity": {"$gte": item["quantity"]}
                },
                {"$inc": {"stock_quantity": -item["quantity"]}}
            )

            if update_result.modified_count == 0:
                raise Exception("race condition out of stock")

            successful_deductions.append(item)

        new_order = {
            "wallet_address": user["wallet_address"],
            "items": processed_items,
            "total_price": str(total_price_decimal),
            "status": "pending",
            "shipping_address": address,
            "tx_hash": None
        }

        result = await db.orders.insert_one(new_order)
        new_order["_id"] = str(result.inserted_id)

    except Exception as e:
        for ded_item in successful_deductions:
            await db.catalog.update_one(
                {"_id": ObjectId(ded_item["product_id"])},
                {"$inc": {"stock_quantity": ded_item["quantity"]}}
            )
        print(f"rollback: {e}")
        raise HTTPException(status_code=400, detail="checkout failed try again")

    print("order created securely")
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

    # Authorization check
    if order["wallet_address"] != user["wallet_address"] and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="forbidden")

    update_dict = {}

    if update_data.tx_hash and order["wallet_address"] == user["wallet_address"]:
        try:
            tx = w3.eth.get_transaction(update_data.tx_hash)
            receipt = w3.eth.get_transaction_receipt(update_data.tx_hash)

            if receipt["status"] != 1:
                raise HTTPException(status_code=400, detail="transaction failed")

            if not tx["to"] or tx["to"].lower() != CONTRACT_ADDRESS.lower():
                raise HTTPException(status_code=400, detail="wrong contract")

            if tx["from"].lower() != user["wallet_address"].lower():
                raise HTTPException(status_code=400, detail="sender mismatch")

            expected_wei = w3.to_wei(str(order["total_price"]), 'ether')
            if tx["value"] < expected_wei:
                raise HTTPException(status_code=400, detail="insufficient funds")

            logs = contract_instance.events.OrderPaid().process_receipt(receipt)
            if not logs:
                raise HTTPException(status_code=400, detail="OrderPaid event missing in transaction")

            event_order_id = logs[0]["args"]["orderId"]
            if event_order_id != order_id:
                raise HTTPException(status_code=400, detail=f"Transaction belongs to a different order: {event_order_id}")

            update_dict["tx_hash"] = update_data.tx_hash
            update_dict["status"] = "paid"

            update_result = await db.orders.update_one(
                {"_id": ObjectId(order_id), "status": "pending"},
                {"$set": update_dict}
            )

            if update_result.modified_count == 0:
                raise HTTPException(status_code=400, detail="order already processed")

        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="tx_hash already used globally")
        except HTTPException:
            raise
        except Exception as e:
            print("web3 error:", e)
            raise HTTPException(status_code=400, detail="verification failed")

    elif update_data.status and user.get("is_admin"):
        update_dict["status"] = update_data.status
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_dict}
        )

    if not update_dict:
        raise HTTPException(status_code=400, detail="invalid update")

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