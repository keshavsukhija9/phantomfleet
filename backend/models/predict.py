import pickle
import os
import pandas as pd
import shap

# Feature list
FEATURES = [
    "eta_drift_pct",
    "carrier_reliability",
    "warehouse_pressure",
    "weather_risk",
    "handoff_margin_hours",
    "downstream_critical",
    "priority_score",
    "route_reliability"
]

# Load model
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model not found at {model_path}. Run train.py first.")

with open(model_path, "rb") as f:
    MODEL = pickle.load(f)

# Initialize SHAP explainer if compatible (XGBoost version can affect this)
EXPLAINER = None
try:
    EXPLAINER = shap.TreeExplainer(MODEL)
    print("Using SHAP TreeExplainer (CPU)")
except Exception as e:
    print(f"SHAP explainer unavailable: {e}. Predictions will work without SHAP values.")


def predict(shipment_dict: dict) -> tuple:
    """
    Returns (failure_prob, top3_shap_features)
    
    Args:
        shipment_dict: Dictionary with shipment features
        
    Returns:
        tuple: (failure_probability: float, top3_shap: dict)
    """
    # Extract features in correct order
    row = pd.DataFrame([{k: shipment_dict.get(k, 0) for k in FEATURES}])
    
    # Get prediction probability
    prob = float(MODEL.predict_proba(row)[0][1])
    
    if EXPLAINER is None:
        return prob, {}
    
    # Get SHAP values
    sv = EXPLAINER.shap_values(row)
    if isinstance(sv, list):
        sv = sv[1] if len(sv) > 1 else sv[0]
    sv = sv[0] if len(sv.shape) > 1 else sv
    
    # Get top 3 features by absolute SHAP value
    top3 = sorted(zip(FEATURES, sv), key=lambda x: abs(x[1]), reverse=True)[:3]
    top3_dict = {k: round(float(v), 3) for k, v in top3}
    
    return prob, top3_dict
