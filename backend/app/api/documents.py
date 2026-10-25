from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ingestion import ingest_documents

router = APIRouter()

@router.post("/ingest")
def trigger_ingestion(db: Session = Depends(get_db)):
    """Reads the markdown files from disk and stores them in Postgres."""
    result = ingest_documents(db)
    return result