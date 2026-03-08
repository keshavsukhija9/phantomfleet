import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from models.predict import predict
from agent.state import AgentState


THRESHOLD = 0.75


def run(state: AgentState) -> AgentState:
    """
    RiskAssessNode: Run XGBoost prediction on all shipments.
    
    Flags at-risk shipments and attaches SHAP explanations.
    Only processes new shipments from current tick to avoid waste.
    """
    risk_map = dict(state.get("risk_map", {}))  # Keep existing risk scores
    active_at_risk = []
    shap_map = dict(state.get("shap_map", {}))  # Keep existing SHAP values
    
    # Build set of shipment IDs that already have interventions
    interventions = state.get("interventions", {})
    shipments_with_interventions = {
        inv["shipment_id"] for inv in interventions.values()
    }
    
    shipments = state.get("shipments", {})
    current_tick = state.get("tick", 0)
    
    # Only process new shipments from current tick (not old retained ones)
    for sid, ship in shipments.items():
        # Skip old shipments (from previous ticks)
        if not sid.startswith(f"T{current_tick}_"):
            # Keep their old risk scores but don't reprocess
            if sid in risk_map and risk_map[sid] >= THRESHOLD:
                if sid not in shipments_with_interventions:
                    active_at_risk.append(sid)
            continue
        
        # Ship is already a dict, use it directly for prediction
        ship_dict = {
            "eta_drift_pct": ship["eta_drift_pct"],
            "carrier_reliability": ship["carrier_reliability"],
            "warehouse_pressure": ship["warehouse_pressure"],
            "weather_risk": ship["weather_risk"],
            "handoff_margin_hours": ship["handoff_margin_hours"],
            "downstream_critical": ship["downstream_critical"],
            "priority_score": ship["priority_score"],
            "route_reliability": ship["route_reliability"],
        }
        
        prob, shap_top3 = predict(ship_dict)
        ship["failure_prob"] = prob
        risk_map[sid] = prob
        shap_map[sid] = shap_top3
        
        # Flag as at-risk if above threshold and no existing intervention
        if prob >= THRESHOLD and sid not in shipments_with_interventions:
            active_at_risk.append(sid)
            ship["status"] = "AT_RISK"
    
    return {
        **state,
        "shipments": shipments,  # Explicitly return mutated shipments
        "risk_map": risk_map,
        "active_at_risk": active_at_risk,
        "shap_map": shap_map,
    }
