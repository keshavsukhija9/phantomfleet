# Capacity pool - hard-coded opportunities for demo
CAPACITY_POOL = [
    {
        "id": "CAP1",
        "type": "truck",
        "carrier": "C2",
        "route": "W1→D1",
        "available_kg": 450,
        "reliability": 0.91,
        "eta_gain_hrs": 3.5,
        "cost_delta": 2.1
    },
    {
        "id": "CAP2",
        "type": "flight",
        "carrier": "AIR1",
        "route": "BOM→MAA",
        "available_kg": 800,
        "reliability": 0.96,
        "eta_gain_hrs": 6.2,
        "cost_delta": 8.5
    },
    {
        "id": "CAP3",
        "type": "van",
        "carrier": "C3",
        "route": "W2→D1",
        "available_kg": 200,
        "reliability": 0.88,
        "eta_gain_hrs": 2.1,
        "cost_delta": 1.5
    },
    {
        "id": "CAP4",
        "type": "truck",
        "carrier": "C5",
        "route": "W3→D2",
        "available_kg": 600,
        "reliability": 0.84,
        "eta_gain_hrs": 4.0,
        "cost_delta": 3.2
    },
    {
        "id": "CAP5",
        "type": "flight",
        "carrier": "AIR2",
        "route": "DEL→BOM",
        "available_kg": 1000,
        "reliability": 0.94,
        "eta_gain_hrs": 5.5,
        "cost_delta": 9.1
    },
    {
        "id": "CAP6",
        "type": "truck",
        "carrier": "C1",
        "route": "W1→D2",
        "available_kg": 500,
        "reliability": 0.89,
        "eta_gain_hrs": 3.8,
        "cost_delta": 2.8
    },
    {
        "id": "CAP7",
        "type": "van",
        "carrier": "C3",
        "route": "W3→D1",
        "available_kg": 250,
        "reliability": 0.87,
        "eta_gain_hrs": 2.5,
        "cost_delta": 1.8
    },
    {
        "id": "CAP8",
        "type": "truck",
        "carrier": "C2",
        "route": "W2→D2",
        "available_kg": 550,
        "reliability": 0.90,
        "eta_gain_hrs": 4.2,
        "cost_delta": 3.0
    },
    {
        "id": "CAP9",
        "type": "flight",
        "carrier": "AIR1",
        "route": "DEL→MAA",
        "available_kg": 900,
        "reliability": 0.95,
        "eta_gain_hrs": 6.0,
        "cost_delta": 8.8
    },
    {
        "id": "CAP10",
        "type": "truck",
        "carrier": "C5",
        "route": "W1→D1",
        "available_kg": 480,
        "reliability": 0.86,
        "eta_gain_hrs": 3.3,
        "cost_delta": 2.5
    }
]


def score_path(cap: dict, memory_boost: float = 1.0) -> float:
    """
    Score a capacity opportunity.
    
    Args:
        cap: Capacity pool entry
        memory_boost: Multiplier from memory (0.8-1.2)
        
    Returns:
        float: Composite score
    """
    return (
        cap["reliability"] * 0.40
        + min(cap["eta_gain_hrs"] / 8.0, 1.0) * 0.35
        - min(cap["cost_delta"] / 10.0, 1.0) * 0.25
    ) * memory_boost
