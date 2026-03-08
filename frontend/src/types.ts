export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  eta_drift_pct: number;
  carrier_reliability: number;
  warehouse_pressure: number;
  weather_risk: number;
  priority: string;
  status: string;
  failure_prob: number;
  intervention_id?: string;
  // XGBoost feature fields (used by model for prediction)
  handoff_margin_hours: number;
  downstream_critical: number;
  priority_score: number;
  route_reliability: number;
}

export interface Intervention {
  id: string;
  shipment_id: string;
  path: string;
  predicted_eta_gain: number;
  cost_delta_pct: number;
  revival_prob: number;
  execution: string;
  outcome: string;
  causal_reason: string;
  score: number;
}

export interface CausalEntry {
  hypothesis?: string;
  primary_cause?: string;
  contributing_factors?: string[];
  confidence?: number;
  expected_failure_mode?: string;
  evidence_citations?: string[];
}

export interface AgentState {
  shipments: Record<string, Shipment>;
  interventions: Record<string, Intervention>;
  risk_map: Record<string, number>;
  pending_approvals: string[];
  tick: number;
  episode_count: number;
  calibration_boost: Record<string, number>;
  active_at_risk: string[];
  causal_map: Record<string, CausalEntry>;
  shap_map: Record<string, unknown>;
  stored_episodes: string[];
}
