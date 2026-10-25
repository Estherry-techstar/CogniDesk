from sqlalchemy.orm import Session
from app.db.models import Ticket, TicketStatus
from openai import OpenAI
import os

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

def generate_ticket_summary(issue_description: str) -> str:
    """Uses the LLM to create a concise summary of the user's issue."""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an IT dispatcher. Summarize the following user issue in one concise sentence for an IT engineer."},
                {"role": "user", "content": issue_description}
            ],
            temperature=0.1
        )
        return response.choices[0].message.content
    except Exception:
        return "AI Summary unavailable. Please read the original description."

def create_ticket(db: Session, user_email: str, issue_description: str):
    """Creates a new support ticket with an AI-generated summary."""
    summary = generate_ticket_summary(issue_description)
    
    new_ticket = Ticket(
        user_email=user_email,
        issue_description=issue_description,
        ai_summary=summary,
        status=TicketStatus.OPEN
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

def get_all_tickets(db: Session):
    """Fetches all tickets for the engineer dashboard."""
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()

def update_ticket_status(db: Session, ticket_id: int, status: TicketStatus, engineer: str = None):
    """Updates a ticket's status and assigns an engineer."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket:
        ticket.status = status
        if engineer:
            ticket.assigned_engineer = engineer
        db.commit()
        db.refresh(ticket)
    return ticket