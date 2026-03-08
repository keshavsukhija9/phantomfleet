import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from simulation.generator import SimulationEngine
from agent.state import AgentState, Shipment, shipment_to_dict, dict_to_shipment

# Global simulation engine instance
_engine = SimulationEngine()


def run(state: AgentState) -> AgentState:
    """
    ObserveNode: Ingest telemetry from simulation engine.
    
    Updates state.shipments with fresh data and increments tick.
    Preserves shipments with active interventions to avoid orphaning them.
    Uses efficient set-based lookup for O(S) performance.
    """
    raw = _engine.step()
    
    # Use tick-prefixed IDs to avoid collision across ticks
    current_tick = state.get("tick", 0) + 1
    
    # Build set of shipment IDs that have interventions (O(I))
    existing_shipments = state.get("shipments", {})
    interventions = state.get("interventions", {})
    shipments_with_interventions = {inv["shipment_id"] for inv in interventions.values()}
    
    # Keep shipments that have active interventions (O(S))
    shipments = {
        sid: ship for sid, ship in existing_shipments.items()
        if sid in shipments_with_interventions
    }
    
    # Add new shipments from this tick (O(50))
    for s in raw:
        # Create unique ID per tick
        unique_id = f"T{current_tick}_{s['id']}"
        
        ship = Shipment(
            id=unique_id,
            origin="O1",
            destination="D1",
            carrier=s["carrier"],
            eta_drift_pct=s["eta_drift_pct"],
            carrier_reliability=s["carrier_reliability"],
            warehouse_pressure=s["warehouse_pressure"],
            weather_risk=s["weather_risk"],
            priority=s["priority"],
            status="HEALTHY",
            failure_prob=0.0,
            handoff_margin_hours=s["handoff_margin_hours"],
            downstream_critical=s["downstream_critical"],
            priority_score=s["priority_score"],
            route_reliability=s["route_reliability"],
        )
        
        # Convert to dict for LangGraph serialization
        shipments[unique_id] = shipment_to_dict(ship)
    
    return {
        **state,
        "shipments": shipments,
        "tick": current_tick,
    }
