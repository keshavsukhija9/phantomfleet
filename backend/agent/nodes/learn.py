import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from memory.episodes import store_episode, get_boost
from agent.state import AgentState


def run(state: AgentState) -> AgentState:
    """
    LearnNode: Store episodes in ChromaDB and update calibration boosts.
    
    This is where the system learns from past interventions.
    Keeps completed interventions in state for UI history display.
    """
    interventions = state.get("interventions", {})
    shipments = state.get("shipments", {})
    stored_episodes = list(state.get("stored_episodes", []))
    calibration_boost = dict(state.get("calibration_boost", {}))
    episode_count = state.get("episode_count", 0)
    
    for iid, inv in interventions.items():
        # Skip if pending or already stored
        if inv["outcome"] == "PENDING" or iid in stored_episodes:
            continue
        
        ship = shipments.get(inv["shipment_id"])
        if not ship:
            continue
        
        # Store episode in Chroma
        episode = {
            "id": iid,
            "shipment_id": inv["shipment_id"],
            "path": inv["path"],
            "revival_prob": inv["revival_prob"],
            "cost_delta": inv["cost_delta_pct"],
            "outcome": inv["outcome"],
            "score": inv["score"],
            "carrier": ship["carrier"],
        }
        
        try:
            store_episode(episode)
            episode_count += 1
            stored_episodes.append(iid)  # Mark as stored (list not set)
            
            # Update calibration boost for this carrier (keyed by carrier for learning to work)
            boost = get_boost(ship["carrier"], inv["outcome"])
            calibration_boost[ship["carrier"]] = boost
        except Exception as e:
            print(f"Error storing episode {iid}: {e}")
    
    # Keep all interventions (don't drop completed ones) for UI history
    return {
        **state,
        "episode_count": episode_count,
        "stored_episodes": stored_episodes,
        "calibration_boost": calibration_boost,
    }
