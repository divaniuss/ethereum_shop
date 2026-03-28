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

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await client.admin.command('ping')
        print("mongo connected")
    except Exception:
        print("mongo error")
    yield

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