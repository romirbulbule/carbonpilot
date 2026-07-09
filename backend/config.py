import os

from dotenv import load_dotenv

load_dotenv()

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
