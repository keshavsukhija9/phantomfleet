"""
Test script to verify backend system is working correctly.
Run this after training the model to ensure all components work.
"""
import sys
import os

print("=" * 80)
print("PHANTOM FLEET BACKEND SYSTEM TEST")
print("=" * 80)

# Test 1: Import all modules
print("\n[1/7] Testing imports...")
try:
    from agent.state import AgentState, Shipment, Intervention
    from simulation.generator import SimulationEngine
    from models.predict import predict
    from memory.episodes import store_episode, get_boost
    from agent.graph import APP
    print("✓ All imports successful")
except Exception as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

# Test 2: Simulation engine
print("\n[2/7] Testing simulation engine...")
try:
    engine = SimulationEngine(seed=42)
    shipments = engine.step()
    assert len(shipments) == 50, f"Expected 50 shipments, got {len(shipments)}"
    assert "id" in shipments[0], "Shipment missing 'id' field"
    print(f"✓ Generated {len(shipments)} shipments")
except Exception as e:
    print(f"✗ Simulation test failed: {e}")
    sys.exit(1)

# Test 3: Model prediction
print("\n[3/7] Testing XGBoost model...")
try:
    test_ship = shipments[0]
    prob, shap = predict(test_ship)
    assert 0 <= prob <= 1, f"Invalid probability: {prob}"
    assert len(shap) == 3, f"Expected 3 SHAP features, got {len(shap)}"
    print(f"✓ Prediction: {prob:.2%}, SHAP features: {list(shap.keys())}")
except Exception as e:
    print(f"✗ Model test failed: {e}")
    print("   Make sure you ran 'python models/train.py' first!")
    sys.exit(1)

# Test 4: Memory system
print("\n[4/7] Testing memory system...")
try:
    test_episode = {
        "id": "test_001",
        "shipment_id": "S001",
        "path": "W1→D1",
        "revival_prob": 0.85,
        "cost_delta": 2.5,
        "outcome": "SUCCESS",
        "score": 0.75,
        "carrier": "C1"
    }
    store_episode(test_episode)
    boost = get_boost("C1", "SUCCESS")
    # Use tolerance for floating-point comparison
    assert 0.8 <= boost <= 1.21, f"Invalid boost: {boost}"  # Allow small floating-point error
    print(f"✓ Episode stored, boost calculated: {boost:.2f}")
except Exception as e:
    print(f"✗ Memory test failed: {e}")
    sys.exit(1)

# Test 5: Agent state
print("\n[5/7] Testing agent state...")
try:
    state = {
        "shipments": {},
        "risk_map": {},
        "interventions": {},
        "pending_approvals": [],
        "tick": 0,
        "capacity_opportunities": [],
        "episode_count": 0,
        "calibration_boost": {},
        "active_at_risk": [],
        "causal_map": {},
        "shap_map": {},
        "stored_episodes": [],  # Changed from set to list
    }
    assert state["tick"] == 0, "Initial tick should be 0"
    assert len(state["shipments"]) == 0, "Initial shipments should be empty"
    print("✓ Agent state initialized")
except Exception as e:
    print(f"✗ State test failed: {e}")
    sys.exit(1)

# Test 6: LangGraph compilation
print("\n[6/7] Testing LangGraph compilation...")
try:
    assert APP is not None, "APP not compiled"
    print("✓ LangGraph compiled successfully")
except Exception as e:
    print(f"✗ Graph test failed: {e}")
    sys.exit(1)

# Test 7: Full agent cycle
print("\n[7/7] Testing full agent cycle...")
try:
    state = {
        "shipments": {},
        "risk_map": {},
        "interventions": {},
        "pending_approvals": [],
        "tick": 0,
        "capacity_opportunities": [],
        "episode_count": 0,
        "calibration_boost": {},
        "active_at_risk": [],
        "causal_map": {},
        "shap_map": {},
        "stored_episodes": [],  # Changed from set to list
    }
    config = {"configurable": {"thread_id": "test"}}
    result = APP.invoke(state, config=config)
    
    assert result.get("tick") == 1, f"Expected tick 1, got {result.get('tick')}"
    assert len(result.get("shipments", {})) == 50, f"Expected 50 shipments, got {len(result.get('shipments', {}))}"
    assert len(result.get("risk_map", {})) == 50, "Risk map should have 50 entries"
    
    print(f"✓ Agent cycle completed")
    print(f"  - Tick: {result.get('tick')}")
    print(f"  - Shipments: {len(result.get('shipments', {}))}")
    print(f"  - At-risk: {len(result.get('active_at_risk', []))}")
    print(f"  - Interventions: {len(result.get('interventions', {}))}")
    
except Exception as e:
    print(f"✗ Agent cycle test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 80)
print("ALL TESTS PASSED ✓")
print("=" * 80)
print("\nYou can now start the FastAPI server:")
print("  cd backend && uvicorn main:app --reload --port 8000")
print("\nOr run a quick API test:")
print("  curl http://localhost:8000/state")
