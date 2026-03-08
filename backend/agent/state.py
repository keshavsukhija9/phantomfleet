from dataclasses import dataclass, field, asdict
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
# Note: shipments and interventions are stored as dicts, not dataclass instances
class AgentState(TypedDict, total=False):
    shipments: Dict[str, dict]  # dict representation of Shipment
    risk_map: Dict[str, float]
    interventions: Dict[str, dict]  # dict representation of Intervention
    pending_approvals: List[str]
    tick: int
    capacity_opportunities: List[dict]
    episode_count: int
    calibration_boost: Dict[str, float]  # carrier → score multiplier from memory (enables learning)
    active_at_risk: List[str]
    causal_map: Dict[str, dict]
    shap_map: Dict[str, dict]
    stored_episodes: List[str]  # Changed from set to list for LangGraph serialization


def shipment_to_dict(ship: Shipment) -> dict:
    """Convert Shipment dataclass to dict for LangGraph serialization."""
    return asdict(ship)


def intervention_to_dict(inv: Intervention) -> dict:
    """Convert Intervention dataclass to dict for LangGraph serialization."""
    return asdict(inv)


def dict_to_shipment(d: dict) -> Shipment:
    """Convert dict to Shipment dataclass."""
    return Shipment(**d)


def dict_to_intervention(d: dict) -> Intervention:
    """Convert dict to Intervention dataclass."""
    return Intervention(**d)
