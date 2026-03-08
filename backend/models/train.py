import numpy as np
import pandas as pd
import pickle
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from simulation.generator import SimulationEngine


def train_model():
    print("Generating training data...")
    # Generate 5000 training samples
    engine = SimulationEngine(seed=0)
    all_samples = []
    for _ in range(100):
        samples = engine.step()
        all_samples.extend(samples)

    df = pd.DataFrame(all_samples)
    features = [
        "eta_drift_pct",
        "carrier_reliability",
        "warehouse_pressure",
        "weather_risk",
        "handoff_margin_hours",
        "downstream_critical",
        "priority_score",
        "route_reliability"
    ]

    # Create failure labels
    df["label"] = (
        ((df.eta_drift_pct > 30) & (df.carrier_reliability < 0.5)) |
        (df.warehouse_pressure > 0.80) |
        (df.handoff_margin_hours < 1.0)
    ).astype(int)

    print(f"Total samples: {len(df)}")
    print(f"Failure rate: {df['label'].mean():.2%}")

    X_train, X_test, y_train, y_test = train_test_split(
        df[features], df["label"], test_size=0.2, random_state=42
    )

    print("Training XGBoost model with GPU acceleration...")
    # GPU-optimized configuration for RTX 3050 with fallback
    # Try CUDA, fall back to CPU if unavailable
    try:
        import xgboost
        # Check if XGBoost was built with CUDA support
        device = "cuda" if "USE_CUDA" in xgboost.build_info() and xgboost.build_info()["USE_CUDA"] == "ON" else "cpu"
    except:
        device = "cpu"
    print(f"Using device: {device}")
    
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        tree_method="hist",  # GPU-accelerated histogram method
        device=device,  # Use GPU if available, else CPU
        eval_metric="logloss"
    )
    
    model.fit(X_train, y_train)

    # Evaluate
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"AUC: {auc:.3f}")

    if auc < 0.85:
        print("WARNING: AUC is below 0.85. Model may need tuning.")
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved to {model_path}")


if __name__ == "__main__":
    train_model()
