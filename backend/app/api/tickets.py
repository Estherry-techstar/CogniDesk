from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.db.models import TicketStatus
from app.services.ticket_service import create_ticket, get_all_tickets, update_ticket_status

router = APIRouter()

class TicketCreate(BaseModel):
    user_email: str
    issue_description: str

class TicketUpdate(BaseModel):
    status: TicketStatus
    assigned_engineer: Optional[str] = None

@router.post("/tickets")
def new_ticket(request: TicketCreate, db: Session = Depends(get_db)):
    """Creates a new IT ticket."""
    ticket = create_ticket(db, request.user_email, request.issue_description)
    return ticket

@router.get("/tickets")
def list_tickets(db: Session = Depends(get_db)):
    """Lists all tickets for the engineer dashboard."""
    return get_all_tickets(db)

@router.patch("/tickets/{ticket_id}")
def modify_ticket(ticket_id: int, request: TicketUpdate, db: Session = Depends(get_db)):
    """Updates a ticket's status or assigns an engineer."""
    ticket = update_ticket_status(db, ticket_id, request.status, request.assigned_engineer)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket