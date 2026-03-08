import numpy as np
from typing import List, Dict


CARRIERS = ["C1", "C2", "C3", "C4", "C5", "C6"]
WAREHOUSES = ["W1", "W2", "W3", "W4", "W5"]
PRIORITIES = ["CRITICAL", "HIGH", "STANDARD"]


class SimulationEngine:
    def __init__(self, seed=42):
        # Use local random state instead of global np.random.seed()
        self.rng = np.random.RandomState(seed)
        self.tick = 0
        self.disruptions = {
            3: {"type": "carrier_degradation", "target": "C4"},
            5: {"type": "weather", "region": "B"},
            7: {"type": "warehouse_congestion", "target": "W3"},
            10: {"type": "compound", "targets": ["C6", "customs"]},
        }
        self.carrier_reliability = {c: 0.85 for c in CARRIERS}
        self.warehouse_pressure = {w: 0.35 for w in WAREHOUSES}
        self.weather_risk = 0.1

    def step(self) -> List[Dict]:
        self.tick += 1
        self._apply_disruptions()
        return self._generate_shipments()

    def _apply_disruptions(self):
        if self.tick in self.disruptions:
            d = self.disruptions[self.tick]
            if d["type"] == "carrier_degradation":
                self.carrier_reliability[d["target"]] = 0.25
            elif d["type"] == "weather":
                self.weather_risk = 0.78
            elif d["type"] == "warehouse_congestion":
                self.warehouse_pressure[d["target"]] = 0.91
            elif d["type"] == "compound":
                self.carrier_reliability["C6"] = 0.20
                self.weather_risk = 0.65
        
        # Gradual recovery after tick 15
        if self.tick > 15:
            self.weather_risk = max(0.1, self.weather_risk - 0.05)
            for k in self.carrier_reliability:
                self.carrier_reliability[k] = min(0.85, self.carrier_reliability[k] + 0.02)

    def _generate_shipments(self) -> List[Dict]:
        shipments = []
        for i in range(50):
            carrier = self.rng.choice(CARRIERS)
            warehouse = self.rng.choice(WAREHOUSES)
            priority = self.rng.choice(PRIORITIES, p=[0.10, 0.25, 0.65])
            
            base_drift = self.rng.exponential(8)
            # Amplify drift if carrier is degraded
            if self.carrier_reliability[carrier] < 0.40:
                base_drift *= 2.5
            
            s = {
                "id": f"S{i:03d}",
                "carrier": str(carrier),
                "warehouse": str(warehouse),
                "priority": str(priority),
                "eta_drift_pct": float(min(base_drift, 80)),
                "carrier_reliability": float(self.carrier_reliability[carrier]),
                "warehouse_pressure": float(self.warehouse_pressure[warehouse]),
                "weather_risk": float(self.weather_risk),
                "handoff_margin_hours": float(max(0.2, self.rng.normal(3.0, 1.2))),
                "downstream_critical": int(self.rng.choice([0, 1, 2, 3], p=[0.5, 0.3, 0.15, 0.05])),
                "priority_score": float({"CRITICAL": 1.0, "HIGH": 0.67, "STANDARD": 0.33}[priority]),
                "route_reliability": float(self.rng.beta(7, 2)),
            }
            shipments.append(s)
        return shipments
