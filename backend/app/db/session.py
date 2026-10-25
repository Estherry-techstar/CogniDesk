import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use the environment variable from docker-compose, or fallback to localhost:5434
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5434/cognidesk")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()