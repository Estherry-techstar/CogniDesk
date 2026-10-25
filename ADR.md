# Architecture Decision Records (ADR)

## ADR 001: Why pgvector instead of a dedicated Vector DB (Pinecone/Chroma)?
**Context:** We needed to store document embeddings and relational ticketing data.
**Decision:** We used PostgreSQL with the `pgvector` extension.
**Rationale:** Keeping vectors and relational data in one ACID-compliant database reduces architectural complexity and eliminates the "distributed data" problem. We do not need to sync user data between two systems.
**Trade-offs:** `pgvector` is slightly slower than dedicated vector databases at extreme scale (10M+ vectors). If we scale to that level, we will migrate the vector index to Azure AI Search.

## ADR 002: Why Local Embeddings instead of OpenAI API?
**Context:** We need to embed internal IT documents.
**Decision:** We used `sentence-transformers` (all-MiniLM-L6-v2) running locally on the CPU.
**Rationale:** Data privacy and cost. Embedding 10,000 documents via OpenAI would cost money and require sending internal company data to a third party. Local embeddings ensure zero data leakage.
**Trade-offs:** Increased the Docker container size by 2GB (due to PyTorch). In production, we would use a CPU-optimized build of PyTorch to reduce cold-start times.

## ADR 003: Hybrid Search Strategy
**Context:** Pure vector search failed to retrieve exact error codes (e.g., "Error 0x80070005").
**Decision:** Implemented a hybrid approach combining Cosine Similarity (vectors) with PostgreSQL `ILIKE` keyword matching.
**Rationale:** Vector search understands intent, while keyword search handles exact string matches.
**Trade-offs:** Current implementation does basic deduplication. In future phases, we will implement Reciprocal Rank Fusion (RRF) to mathematically weight the scores.

## ADR 004: Resilience and Prompt Injection Guardrails
**Context:** LLM providers can timeout, and users can attempt to manipulate the AI.
**Decision:** Implemented a basic heuristic prompt-injection filter at the service layer, and an exponential backoff retry mechanism for LLM API calls.
**Rationale:** Prevents malicious inputs from wasting API tokens, and ensures high availability even when OpenRouter experiences transient network blips.
**Trade-offs:** Heuristic filters can be bypassed by sophisticated adversarial prompts (future work: implement a dedicated classifier model for injection detection).