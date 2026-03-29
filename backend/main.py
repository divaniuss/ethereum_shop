from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from backend.api.auth import router as auth_router, limiter
from backend.api.profile import router as profile_router
from backend.api.catalog import router as catalog_router
from backend.api.orders import router as orders_router
from backend.db.database import client
from fastapi.staticfiles import StaticFiles
from backend.db.database import db
import asyncio
from datetime import datetime, timedelta, timezone
from bson import ObjectId



async def cancel_expired_orders():
    while True:
        try:
            await asyncio.sleep(60)
            expiration_time = datetime.now(timezone.utc) - timedelta(minutes=15)

            cursor = db.orders.find({
                "status": "pending",
                "created_at": {"$lt": expiration_time}
            })

            async for order in cursor:
                for item in order["items"]:
                    await db.catalog.update_one(
                        {"_id": ObjectId(item["product_id"])},
                        {"$inc": {"stock_quantity": item["quantity"]}}
                    )

                await db.orders.update_one(
                    {"_id": order["_id"]},
                    {"$set": {"status": "cancelled"}}
                )
                print(f"Отменен просроченный заказ {order['_id']}, товары возвращены на склад.")

        except asyncio.CancelledError:
            print("Фоновая задача проверки заказов остановлена.")
            break
        except Exception as e:
            print(f"Ошибка в фоновой задаче отмены заказов: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MongoDB
    try:
        await client.admin.command('ping')
        print("mongo connected")
    except Exception:
        print("mongo error")


    task = asyncio.create_task(cancel_expired_orders())

    yield

    task.cancel()


app = FastAPI(title="Beer Shop", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(catalog_router)
app.include_router(orders_router)