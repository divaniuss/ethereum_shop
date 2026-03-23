from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from backend.core.dependencies import get_current_user
from backend.db.database import db

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    shipping_address: Optional[str] = None


@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    user["_id"] = str(user["_id"])
    return user


@router.patch("/me")
async def update_my_profile(
        update_data: ProfileUpdate,
        user: dict = Depends(get_current_user)
):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if update_dict:
        await db.users.update_one(
            {"wallet_address": user["wallet_address"]},
            {"$set": update_dict}
        )
        print("profile updated")

    updated_user = await db.users.find_one({"wallet_address": user["wallet_address"]})
    updated_user["_id"] = str(updated_user["_id"])
    return updated_user