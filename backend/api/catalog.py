from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from backend.core.dependencies import get_current_user, get_admin_user
from backend.db.database import db

router = APIRouter(prefix="/catalog", tags=["catalog"])

print("CATALOG FILE LOADED")


class CatalogCreate(BaseModel):
    name: str
    description: str
    price_eth: float
    stock_quantity: int
    image_url: str

class CatalogUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_eth: Optional[float] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None


@router.get("/")
async def get_catalog():
    items = []
    async for item in db.catalog.find():
        item["_id"] = str(item["_id"])
        items.append(item)
    return items


@router.get("/{item_id}")
async def get_item(item_id: str):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="invalid id")

    item = await db.catalog.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="item missing")

    item["_id"] = str(item["_id"])
    return item


@router.post("/")
async def create_item(item_data: CatalogCreate, admin: dict = Depends(get_admin_user)):
    new_item = item_data.model_dump()
    result = await db.catalog.insert_one(new_item)
    new_item["_id"] = str(result.inserted_id)
    print("item created")
    return new_item


@router.patch("/{item_id}")
async def update_item(
        item_id: str,
        update_data: CatalogUpdate,
        admin: dict = Depends(get_admin_user)
):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="invalid id")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if not update_dict:
        raise HTTPException(status_code=400, detail="empty data")

    result = await db.catalog.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="item missing")

    print("item updated")
    updated_item = await db.catalog.find_one({"_id": ObjectId(item_id)})
    updated_item["_id"] = str(updated_item["_id"])
    return updated_item


@router.delete("/{item_id}")
async def delete_item(item_id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="invalid id")

    result = await db.catalog.delete_one({"_id": ObjectId(item_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="item missing")

    print("item deleted")
    return {"status": "deleted"}