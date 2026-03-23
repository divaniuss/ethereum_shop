import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("secret missing")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
MONGO_URI = os.getenv("MONGO_URI")