from fastapi import APIRouter, HTTPException
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/delivery", tags=["Delivery"])

NP_API_URL = "https://api.novaposhta.ua/v2.0/json/"

NP_API_KEY = os.getenv("NP_API_KEY")


@router.get("/cities")
async def search_cities(q: str = ""):

    if not NP_API_KEY:
        raise HTTPException(status_code=500, detail="API ключ Новой Почты не настроен на сервере.")

    payload = {
        "apiKey": NP_API_KEY,
        "modelName": "Address",
        "calledMethod": "getCities",
        "methodProperties": {
            "FindByString": q,
            "Limit": "50"
        }
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(NP_API_URL, json=payload)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка соединения с Новой Почтой: {str(e)}")

        if not data.get("success"):
            error_msgs = data.get("errors", ["Неизвестная ошибка API Новой Почты"])
            raise HTTPException(status_code=400, detail=f"Ошибка API НП: {', '.join(error_msgs)}")

        cities = [{"description": city["Description"], "ref": city["Ref"]} for city in data.get("data", [])]
        return cities


@router.get("/warehouses")
async def get_warehouses(city_ref: str):
    if not NP_API_KEY:
        raise HTTPException(status_code=500, detail="API ключ Новой Почты не настроен на сервере.")

    payload = {
        "apiKey": NP_API_KEY,
        "modelName": "Address",
        "calledMethod": "getWarehouses",
        "methodProperties": {
            "CityRef": city_ref,
            "Page": "1"
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(NP_API_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    if not data.get("success"):
        error_msgs = data.get("errors", ["Неизвестная ошибка API НП"])
        raise HTTPException(status_code=400, detail=f"Ошибка API НП: {', '.join(error_msgs)}")

    return [
        {"description": w["Description"], "ref": w["Ref"]}
        for w in data.get("data", [])
    ]