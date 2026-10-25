from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.tickets import router as tickets_router
from app.api.auth import router as auth_router

app = FastAPI(
    title="CogniDesk API", 
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(documents_router, prefix="/api/v1", tags=["Documents"])
app.include_router(chat_router, prefix="/api/v1", tags=["Chat"])
app.include_router(tickets_router, prefix="/api/v1", tags=["Tickets"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"]) # <-- Added Auth Router

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "CogniDesk Backend"}