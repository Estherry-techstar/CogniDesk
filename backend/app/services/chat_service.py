import os
import time
from openai import OpenAI
from sqlalchemy.orm import Session
from app.services.ingestion import search_knowledge_base

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

def is_prompt_injection(text: str) -> bool:
    """Basic heuristic guardrail against prompt injection."""
    malicious_phrases = [
        "ignore previous instructions", 
        "ignore all previous", 
        "system prompt", 
        "you are now", 
        "forget your rules",
        "print your instructions"
    ]
    text_lower = text.lower()
    return any(phrase in text_lower for phrase in malicious_phrases)

def generate_answer(db: Session, question: str):
    # Start Timer
    request_start = time.perf_counter()
    
    # 0. Security Check (Prompt Injection Guardrail)
    if is_prompt_injection(question):
        return {
            "answer": "⚠️ Security Warning: Your message contains patterns associated with prompt injection. Please rephrase your IT question.",
            "sources": [],
            "metrics": {
                "retrieval_time_ms": 0, 
                "generation_time_ms": 0, 
                "total_time_ms": 0, 
                "tokens_used": 0
            }
        }

    # 1. Retrieval Phase
    retrieval_start = time.perf_counter()
    context_chunks = search_knowledge_base(db, question, limit=3)
    retrieval_end = time.perf_counter()
    retrieval_time = retrieval_end - retrieval_start
    
    if not context_chunks:
        return {
            "answer": "I could not find any relevant information in the knowledge base.",
            "sources": [],
            "metrics": {"retrieval_time_ms": round(retrieval_time * 1000, 2)}
        }

    context_text = "\n\n---\n\n".join([
        f"Source Document: {chunk.document.filename}\nContent: {chunk.content}" 
        for chunk in context_chunks
    ])
    sources = list(set([chunk.document.filename for chunk in context_chunks]))

    system_prompt = """You are CogniDesk, an intelligent IT Help Desk Assistant for Acme Corp.
    You must answer the user's question USING ONLY the provided context. 
    If the answer is not in the context, say "I don't have enough information in my knowledge base to answer that. Would you like me to create a support ticket?"
    Always cite the source document names in your answer."""

    user_prompt = f"Context:\n{context_text}\n\nUser Question: {question}"

    # 2. Generation Phase (with Resilience & Retry Logic)
    generation_start = time.perf_counter()
    
    max_retries = 3
    response = None
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                timeout=10.0 # 10 second timeout
            )
            break # Success! Break out of retry loop
        except Exception as e:
            print(f"LLM Error (Attempt {attempt+1}/{max_retries}): {str(e)}")
            if attempt == max_retries - 1:
                # Final attempt failed
                return {
                    "answer": "I am currently experiencing high traffic. Please try again in a moment.",
                    "sources": [],
                    "metrics": {}
                }
            time.sleep(2 ** attempt) # Exponential backoff: 1s, 2s, 4s...

    generation_end = time.perf_counter()
    generation_time = generation_end - generation_start
    
    answer = response.choices[0].message.content
    tokens_used = response.usage.total_tokens if response.usage else 0
    
    total_time = time.perf_counter() - request_start

    # Print observability trace to terminal
    print(f"\n--- 🔍 OBSERVABILITY TRACE ---")
    print(f"Question: {question[:50]}...")
    print(f"Retrieval Time: {retrieval_time*1000:.2f}ms")
    print(f"Generation Time: {generation_time*1000:.2f}ms")
    print(f"Total Latency: {total_time*1000:.2f}ms")
    print(f"Tokens Used: {tokens_used}")
    print(f"------------------------------\n")
    
    return {
        "answer": answer,
        "sources": sources,
        "metrics": {
            "retrieval_time_ms": round(retrieval_time * 1000, 2),
            "generation_time_ms": round(generation_time * 1000, 2),
            "total_time_ms": round(total_time * 1000, 2),
            "tokens_used": tokens_used
        }
    }