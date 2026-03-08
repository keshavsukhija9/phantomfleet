import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import uuid
from agent.state import AgentState, Intervention, intervention_to_dict
from agent.nodes.capacity import CAPACITY_POOL, score_path


def run(state: AgentState) -> AgentState:
    """
    PlanNode: Score capacity opportunities and create interventions.
    
    Applies memory-based calibration boost to scoring (keyed by carrier for learning).
    """
    active_at_risk = state.get("active_at_risk", [])
    shipments = state.get("shipments", {})
    causal_map = state.get("causal_map", {})
    calibration_boost = state.get("calibration_boost", {})
    interventions = dict(state.get("interventions", {}))
    
    for sid in active_at_risk[:3]:  # Cap at 3
        ship = shipments[sid]
        # Get boost by carrier (for learning to work across ticks)
        boost = calibration_boost.get(ship["carrier"], 1.0)
        
        # Score all capacity entries
        scored = [(score_path(c, boost), c) for c in CAPACITY_POOL]
        scored.sort(reverse=True)
        best_score, best = scored[0]
        
        # Create intervention
        intervention = Intervention(
            id=str(uuid.uuid4())[:8],
            shipment_id=sid,
            path=best["route"],
            predicted_eta_gain=best["eta_gain_hrs"],
            cost_delta_pct=best["cost_delta"],
            revival_prob=best["reliability"],
            execution="PENDING",
            causal_reason=causal_map.get(sid, {}).get("hypothesis", ""),
            score=best_score,
        )
        
        # Convert to dict for LangGraph serialization
        interventions[intervention.id] = intervention_to_dict(intervention)
        ship["intervention_id"] = intervention.id
    
    return {
        **state,
        "shipments": shipments,  # Explicitly return mutated shipments
        "interventions": interventions,
    }
