from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine, SessionLocal
import app.db.models as models
from app.core.auth import get_password_hash

def init_db():
    print("Connecting to database...")
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed Users
    db = SessionLocal()
    if db.query(models.User).count() == 0:
        print("Seeding users...")
        staff = models.User(email="staff@acmecorp.com", hashed_password=get_password_hash("password123"), role="staff")
        engineer = models.User(email="engineer@acmecorp.com", hashed_password=get_password_hash("password123"), role="engineer")
        db.add(staff)
        db.add(engineer)
        db.commit()
        print("✅ Users created: staff@acmecorp.com / engineer@acmecorp.com (Password: password123)")
    db.close()
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    init_db()