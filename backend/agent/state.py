from dataclasses import dataclass, field
from typing import Dict, List, Optional, TypedDict


@dataclass
class Shipment:
    id: str
    origin: str
    destination: str
    carrier: str
    eta_drift_pct: float
    carrier_reliability: float
    warehouse_pressure: float
    weather_risk: float
    priority: str  # CRITICAL / HIGH / STANDARD
    status: str  # HEALTHY / AT_RISK / RESCUED / FAILED
    failure_prob: float = 0.0
    intervention_id: Optional[str] = None
    # Additional features for XGBoost
    handoff_margin_hours: float = 3.0
    downstream_critical: int = 0
    priority_score: float = 0.33
    route_reliability: float = 0.85


@dataclass
class Intervention:
    id: str
    shipment_id: str
    path: str
    predicted_eta_gain: float
    cost_delta_pct: float
    revival_prob: float
    execution: str  # PENDING / AUTO / PENDING_HUMAN / HUMAN_APPROVED / REJECTED
    outcome: str = "PENDING"  # SUCCESS / FAILURE / PENDING
    causal_reason: str = ""
    score: float = 0.0


# TypedDict for LangGraph compatibility
class AgentState(TypedDict, total=False):
    shipments: Dict[str, Shipment]
    risk_map: Dict[str, float]
    interventions: Dict[str, Intervention]
    pending_approvals: List[str]
    tick: int
    capacity_opportunities: List[dict]
    episode_count: int
    calibration_boost: Dict[str, float]  # shipment_id → score multiplier from memory
    active_at_risk: List[str]
    causal_map: Dict[str, dict]
    shap_map: Dict[str, dict]
    stored_episodes: List[str]  # Changed from set to list for LangGraph serialization
