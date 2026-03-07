import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agent.state import AgentState


def run(state: AgentState) -> AgentState:
    """
    ActNode: Execute interventions with guardrails.
    
    All 4 guardrails must pass for AUTO execution:
    1. score >= 0.70
    2. cost_delta_pct <= 5.0
    3. priority != CRITICAL
    4. revival_prob >= 0.65
    """
    interventions = state.get("interventions", {})
    shipments = state.get("shipments", {})
    pending_approvals = list(state.get("pending_approvals", []))
    
    for iid, inv in interventions.items():
        if inv.execution != "PENDING":
            continue
        
        # Check if shipment still exists
        if inv.shipment_id not in shipments:
            print(f"Warning: Shipment {inv.shipment_id} not found for intervention {iid}")
            continue
            
        ship = shipments[inv.shipment_id]
        
        # Check all 4 guardrails
        guardrails = [
            inv.score >= 0.70,
            inv.cost_delta_pct <= 5.0,
            ship.priority != "CRITICAL",
            inv.revival_prob >= 0.65,
        ]
        
        if all(guardrails):
            inv.execution = "AUTO"
            inv.outcome = "SUCCESS"  # Set outcome so learn node can process it
            ship.status = "RESCUED"
        else:
            inv.execution = "PENDING_HUMAN"
            if iid not in pending_approvals:
                pending_approvals.append(iid)
    
    return {
        **state,
        "pending_approvals": pending_approvals,
    }
