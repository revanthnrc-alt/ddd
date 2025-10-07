"""Database setup using SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./relay.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables from models. Import models here to ensure metadata is registered."""
    from models import Base

    Base.metadata.create_all(bind=engine)
