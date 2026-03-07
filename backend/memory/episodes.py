import chromadb
import json

# Initialize ChromaDB client
_client = chromadb.Client()
_col = _client.get_or_create_collection("interventions")

print("ChromaDB initialized (using default embeddings)")


def store_episode(ep: dict):
    """
    Store an intervention episode in ChromaDB.
    
    Args:
        ep: Episode dictionary with keys: id, shipment_id, path, 
            revival_prob, cost_delta, outcome, score, carrier
    """
    # Create semantic text for better query quality
    carrier = ep.get("carrier", "unknown")
    outcome = ep["outcome"]
    path = ep["path"]
    
    # Semantic description for embedding
    semantic_text = (
        f"Carrier {carrier} intervention on route {path} resulted in {outcome}. "
        f"Revival probability was {ep['revival_prob']:.2f} with cost delta {ep['cost_delta']:.1f}%."
    )
    
    _col.add(
        ids=[ep["id"]],
        documents=[semantic_text],  # Use semantic text instead of raw JSON
        metadatas=[{
            "outcome": outcome,
            "path": path,
            "score": float(ep["score"]),
            "carrier": carrier,
            "revival_prob": float(ep["revival_prob"]),
            "cost_delta": float(ep["cost_delta"]),
        }]
    )


def get_boost(carrier: str, last_outcome: str) -> float:
    """
    Query memory for similar past interventions involving this carrier.
    Return a score multiplier: >1 if historically successful, <1 if not.
    
    Args:
        carrier: Carrier code (e.g., "C1", "C2")
        last_outcome: Most recent outcome for context
        
    Returns:
        float: Boost multiplier in range [0.8, 1.2]
    """
    try:
        # Query with semantic text for better matching
        query_text = f"Carrier {carrier} intervention history and outcomes"
        
        results = _col.query(
            query_texts=[query_text],
            n_results=5,
            where={"outcome": {"$ne": "PENDING"}}
        )
        
        if not results["metadatas"] or not results["metadatas"][0]:
            return 1.0
        
        # Filter to only this carrier's results
        carrier_outcomes = [
            m["outcome"] for m in results["metadatas"][0]
            if m.get("carrier") == carrier
        ]
        
        if not carrier_outcomes:
            return 1.0
            
        success_rate = carrier_outcomes.count("SUCCESS") / len(carrier_outcomes)
        # Boost range: 0.8 (all failures) to 1.2 (all successes)
        return 0.8 + (success_rate * 0.4)
    except Exception as e:
        print(f"Error in get_boost: {e}")
        return 1.0
