import os
import glob
from sqlalchemy.orm import Session
from sqlalchemy import text
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from app.db.models import Document, DocumentChunk

# Load the local embedding model (384 dimensions as defined in our DB)
print("Loading embedding model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def ingest_documents(db: Session, data_dir: str = "/app/data/it_knowledge_base"):
    file_paths = glob.glob(os.path.join(data_dir, "*.md"))
    
    if not file_paths:
        print(f"No markdown files found in {data_dir}")
        return {"status": "error", "message": "No files found"}

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len
    )

    ingested_count = 0
    for file_path in file_paths:
        filename = os.path.basename(file_path)
        
        # Skip if already ingested (Idempotency)
        existing_doc = db.query(Document).filter(Document.filename == filename).first()
        if existing_doc:
            continue

        print(f"Ingesting {filename}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        doc = Document(filename=filename)
        db.add(doc)
        db.commit()
        db.refresh(doc)

        chunks = text_splitter.split_text(content)
        
        for chunk_text in chunks:
            # Generate the 384-dim vector
            embedding = embedding_model.encode(chunk_text).tolist()
            
            chunk = DocumentChunk(
                document_id=doc.id,
                content=chunk_text,
                embedding=embedding
            )
            db.add(chunk)
        
        db.commit()
        ingested_count += 1

    return {"status": "success", "message": f"Ingested {ingested_count} documents"}

def search_knowledge_base(db: Session, query: str, limit: int = 3):
    """Hybrid Search: Vector similarity + Keyword matching"""
    
    # 1. Vector Search (Semantic meaning)
    query_embedding = embedding_model.encode(query).tolist()
    vector_results = db.query(DocumentChunk).order_by(
        DocumentChunk.embedding.cosine_distance(query_embedding)
    ).limit(limit).all()
    
    # 2. Keyword Fallback (For exact matches like error codes)
    # This searches for the exact words in the query
    keyword_results = []
    if len(query) < 50: # Only do exact matching for short queries (like error codes)
        keyword_results = db.query(DocumentChunk).filter(
            DocumentChunk.content.ilike(f"%{query}%")
        ).limit(limit).all()
    
    # 3. Merge and Deduplicate by ID
    combined = {chunk.id: chunk for chunk in vector_results + keyword_results}
    
    # Return top unique results
    return list(combined.values())[:limit]