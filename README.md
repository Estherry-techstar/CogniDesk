# 🧠 CogniDesk: Enterprise AI IT Help Desk Assistant

CogniDesk is a production-grade, agentic RAG (Retrieval-Augmented Generation) application designed to automate Level 1 IT support. It retrieves answers from internal IT documentation, generates grounded responses with citations, and intelligently escalates unresolved issues to human engineers via a Human-in-the-Loop (HITL) ticketing system.

## 🚀 Key Features
- **Agentic RAG Pipeline:** Uses local embeddings (`all-MiniLM-L6-v2`) and OpenAI (`gpt-4o-mini`) to provide strictly grounded answers with source citations.
- **Hybrid Search:** Combines semantic vector search (pgvector) with exact keyword matching (PostgreSQL `ILIKE`) to catch specific error codes.
- **Human-in-the-Loop (HITL):** A full ticketing system where the AI summarizes user issues and routes them to an Engineer Dashboard.
- **Role-Based Access Control (RBAC):** Separate frontend views for Staff (Chat) and Engineers (Dashboard).
- **Observability & Tracing:** Built-in middleware tracks retrieval latency, LLM generation time, and token costs per request.
- **Security Guardrails:** Heuristic prompt-injection detection blocks malicious inputs.
- **Resilience:** Exponential backoff retry logic ensures high availability during LLM provider timeouts.

## 🏗️ System Architecture

1. **Frontend (Next.js + Tailwind CSS):** A responsive, high-contrast UI with a mock login portal, chat interface, and an engineer Kanban dashboard.
2. **Backend (FastAPI):** High-performance async Python API.
3. **Database (PostgreSQL + pgvector):** Stores relational data (tickets, users) and vector embeddings in a single ACID-compliant database.
4. **LLM Integration (OpenRouter):** Provider-agnostic integration allowing seamless switching between models.

## 🛠️ Tech Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Pydantic
- **AI/ML:** `sentence-transformers`, OpenAI API, LangChain Text Splitters
- **Database:** PostgreSQL 16, `pgvector` extension
- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide Icons
- **Infrastructure:** Docker, Docker Compose

## 🚦 Getting Started (Local Development)

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here