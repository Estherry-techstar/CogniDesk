import json
import time
from app.db.session import SessionLocal
from app.services.ingestion import search_knowledge_base

def evaluate():
    print("🚀 Starting RAG Evaluation...")
    
    # Load the dataset (Note the path is relative to the /app directory in Docker)
    with open("evaluation/test_dataset.json", "r") as f:
        test_cases = json.load(f)

    db = SessionLocal()
    hits = 0
    total = len(test_cases)

    print("-" * 80)
    print(f"{'Question':<50} | {'Retrieved Source':<25} | {'Status'}")
    print("-" * 80)

    start_time = time.perf_counter()

    for case in test_cases:
        query = case["question"]
        expected = case["expected_source"]

        # Get top 3 chunks from our existing search function
        results = search_knowledge_base(db, query, limit=3)
        
        # Extract unique filenames from the results
        retrieved_sources = list(set([chunk.document.filename for chunk in results]))

        # Check if the expected source is in the retrieved sources (Recall@3)
        is_hit = expected in retrieved_sources

        if is_hit:
            hits += 1
            status = "✅ HIT"
        else:
            status = "❌ MISS"

        # Format output for the terminal
        short_q = query[:47] + "..." if len(query) > 50 else query
        short_retrieved = retrieved_sources[0] if retrieved_sources else "None"
        
        print(f"{short_q:<50} | {short_retrieved:<25} | {status}")

    end_time = time.perf_counter()
    db.close()

    # Calculate Metrics
    recall_at_3 = (hits / total) * 100
    avg_time = (end_time - start_time) / total

    print("-" * 80)
    print(f"📊 RESULTS:")
    print(f"Total Test Cases: {total}")
    print(f"Successful Retrievals: {hits}")
    print(f"Recall@3 Score: {recall_at_3:.2f}%")
    print(f"Average Retrieval Latency: {avg_time:.4f} seconds")
    print("-" * 80)

if __name__ == "__main__":
    evaluate()