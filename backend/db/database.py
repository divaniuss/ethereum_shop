from motor.motor_asyncio import AsyncIOMotorClient
from backend.core.config import MONGO_URI

client = AsyncIOMotorClient(MONGO_URI)
db = client.beer_shop