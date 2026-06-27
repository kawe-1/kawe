import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]
# Supabase requires sslmode=require — append it if not already present
if "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # drops stale connections before use
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """
    FastAPI / dependency-injection style session provider.
    Use as:
        with get_db() as db:
            ...
    or as a FastAPI Depends() dependency.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
