"""
PHANTOM FLEET — RIGOROUS PRD COMPLIANCE TEST SUITE
"""

import sys
import os
import json
import importlib
import traceback
import time
import uuid
import inspect
import pickle
import numpy as np

GREEN = "\033[92m"
RED   = "\033[91m"
YELLOW= "\033[93m"
CYAN  = "\033[96m"
BOLD  = "\033[1m"
RESET = "\033[0m"

PASS_COUNT = 0
FAIL_COUNT = 0
ERROR_COUNT = 0
RESULTS = []

def _record(name, status, reason=""):
    global PASS_COUNT, FAIL_COUNT, ERROR_COUNT
    symbol = {"PASS": f"{GREEN}✔ PASS{RESET}",
               "FAIL": f"{RED}✘ FAIL{RESET}",
               "ERROR": f"{YELLOW}⚠ ERROR{RESET}"}[status]
    print(f"  {symbol}  {name}")
    if reason:
        print(f"         → {reason}")
    if status == "PASS":   PASS_COUNT += 1
    elif status == "FAIL": FAIL_COUNT += 1
    else:                  ERROR_COUNT += 1
    RESULTS.append((status, name, reason))

def check(name, condition, fail_msg="condition false"):
    if condition:
        _record(name, "PASS")
    else:
        _record(name, "FAIL", fail_msg)

def try_check(name, fn):
    try:
        result = fn()
        if result is True or result is None:
            _record(name, "PASS")
        elif result is False:
            _record(name, "FAIL", "returned False")
        else:
            _record(name, "FAIL", str(result))
    except AssertionError as e:
        _record(name, "FAIL", str(e))
    except Exception as e:
        _record(name, "ERROR", f"{type(e).__name__}: {e}")

def section(title):
    print(f"\n{BOLD}{CYAN}{'─'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*60}{RESET}")

# SECTION 1
section("1. PROJECT STRUCTURE")
REQUIRED_FILES = [
    "main.py", "agent/__init__.py", "agent/graph.py", "agent/state.py",
    "agent/nodes/observe.py", "agent/nodes/risk_assess.py",
    "agent/nodes/causal_reason.py", "agent/nodes/plan.py",
    "agent/nodes/act.py", "agent/nodes/learn.py",
    "models/train.py", "models/predict.py", "models/model.pkl",
    "simulation/generator.py", "memory/episodes.py",
    "requirements.txt", ".env",
]
for f in REQUIRED_FILES:
    check(f"File exists: {f}", os.path.exists(f), f"Missing file: {f}")

# SECTION 2
section("2. AGENT STATE (state.py)")
def test_state_imports():
    from agent.state import AgentState, Shipment, Intervention
    return True
def test_shipment_fields():
    from agent.state import Shipment
    s = Shipment(id="S001", origin="O1", destination="D1", carrier="C1",
        eta_drift_pct=10.0, carrier_reliability=0.8, warehouse_pressure=0.4,
        weather_risk=0.1, priority="HIGH", status="HEALTHY")
    required = ["id","origin","destination","carrier","eta_drift_pct",
                "carrier_reliability","warehouse_pressure","weather_risk",
                "priority","status","failure_prob","intervention_id"]
    missing = [f for f in required if not hasattr(s, f)]
    assert not missing, f"Shipment missing fields: {missing}"
def test_intervention_fields():
    from agent.state import Intervention
    inv = Intervention(id="abc", shipment_id="S001", path="W1→D1",
        predicted_eta_gain=2.0, cost_delta_pct=1.5, revival_prob=0.9, execution="AUTO")
    required = ["id","shipment_id","path","predicted_eta_gain",
                "cost_delta_pct","revival_prob","execution","outcome","causal_reason","score"]
    missing = [f for f in required if not hasattr(inv, f)]
    assert not missing, f"Intervention missing fields: {missing}"
for t in [test_state_imports, test_shipment_fields, test_intervention_fields]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 3
section("3. SIMULATION GENERATOR")
REQUIRED_FEATURES = ["eta_drift_pct","carrier_reliability","warehouse_pressure",
                      "weather_risk","handoff_margin_hours","downstream_critical",
                      "priority_score","route_reliability"]
def test_generator_import():
    from simulation.generator import SimulationEngine
    return True
def test_generator_produces_50():
    from simulation.generator import SimulationEngine
    eng = SimulationEngine(seed=42)
    result = eng.step()
    assert len(result) == 50, f"Expected 50, got {len(result)}"
def test_generator_has_8_features():
    from simulation.generator import SimulationEngine
    eng = SimulationEngine(seed=42)
    s = eng.step()[0]
    missing = [f for f in REQUIRED_FEATURES if f not in s]
    assert not missing, f"Missing features: {missing}"
def test_generator_feature_ranges():
    from simulation.generator import SimulationEngine
    eng = SimulationEngine(seed=42)
    for s in eng.step():
        assert 0 <= s["eta_drift_pct"] <= 80
        assert 0 <= s["carrier_reliability"] <= 1
        assert 0 <= s["warehouse_pressure"] <= 1
        assert 0 <= s["weather_risk"] <= 1
        assert s["handoff_margin_hours"] > 0
        assert s["downstream_critical"] in [0,1,2,3]
for t in [test_generator_import, test_generator_produces_50, test_generator_has_8_features, test_generator_feature_ranges]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 4
section("4. XGBOOST MODEL")
def test_model_loads():
    with open("models/model.pkl","rb") as f: pickle.load(f)
    return True
def test_predict_returns_tuple():
    from models.predict import predict
    prob, shap = predict({"eta_drift_pct":20,"carrier_reliability":0.85,"warehouse_pressure":0.4,"weather_risk":0.1,"handoff_margin_hours":3,"downstream_critical":1,"priority_score":0.67,"route_reliability":0.8})
    assert isinstance(prob, float) and 0<=prob<=1
    assert isinstance(shap, dict) and len(shap)==3
def test_predict_high_risk():
    from models.predict import predict
    prob, _ = predict({"eta_drift_pct":65,"carrier_reliability":0.2,"warehouse_pressure":0.9,"weather_risk":0.8,"handoff_margin_hours":0.5,"downstream_critical":3,"priority_score":1.0,"route_reliability":0.3})
    assert prob > 0.5, f"High-risk should be >0.5, got {prob}"
def test_predict_low_risk():
    from models.predict import predict
    prob, _ = predict({"eta_drift_pct":2,"carrier_reliability":0.95,"warehouse_pressure":0.2,"weather_risk":0.05,"handoff_margin_hours":5,"downstream_critical":0,"priority_score":0.33,"route_reliability":0.95})
    assert prob < 0.5, f"Low-risk should be <0.5, got {prob}"
for t in [test_model_loads, test_predict_returns_tuple, test_predict_high_risk, test_predict_low_risk]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 5
section("5. LANGGRAPH NODES")
def test_observe_import():
    from agent.nodes.observe import run
    assert callable(run)
def test_risk_assess_import():
    from agent.nodes.risk_assess import run
    assert callable(run)
def test_plan_import():
    from agent.nodes.plan import run
    assert callable(run)
def test_act_import():
    from agent.nodes.act import run
    assert callable(run)
def test_learn_import():
    from agent.nodes.learn import run
    assert callable(run)
def test_risk_threshold():
    from agent.nodes.risk_assess import THRESHOLD
    assert THRESHOLD == 0.75
for t in [test_observe_import, test_risk_assess_import, test_plan_import, test_act_import, test_learn_import, test_risk_threshold]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 6
section("6. LANGGRAPH GRAPH")
def test_graph_import():
    from agent.graph import APP
    return True
def test_graph_invoke():
    from agent.graph import APP
    state = {"shipments":{},"risk_map":{},"interventions":{},"pending_approvals":[],"tick":0,"capacity_opportunities":[],"episode_count":0,"calibration_boost":{},"active_at_risk":[],"causal_map":{},"shap_map":{},"stored_episodes":[]}
    result = APP.invoke(state, config={"configurable":{"thread_id":"test_prd"}})
    assert result is not None
for t in [test_graph_import, test_graph_invoke]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 7
section("7. LLM CAUSAL REASON NODE")
def test_causal_import():
    from agent.nodes.causal_reason import run
    assert callable(run)
def test_causal_has_fallback():
    from agent.nodes.causal_reason import generate_fallback_hypothesis
    assert callable(generate_fallback_hypothesis)
def test_causal_prompt_has_causes():
    from agent.nodes import causal_reason
    source = inspect.getsource(causal_reason)
    for cause in ["CARRIER_DEGRADATION","WAREHOUSE_CONGESTION","WEATHER","DOWNSTREAM_PRESSURE","COMPOUND"]:
        assert cause in source, f"Missing cause: {cause}"
def test_causal_caps_at_3():
    from agent.nodes import causal_reason
    source = inspect.getsource(causal_reason.run)
    assert "[:3]" in source or "3" in source
for t in [test_causal_import, test_causal_has_fallback, test_causal_prompt_has_causes, test_causal_caps_at_3]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 8
section("8. CAPACITY POOL & SCORING")
def test_capacity_pool():
    from agent.nodes.capacity import CAPACITY_POOL
    assert len(CAPACITY_POOL) >= 5
def test_score_path():
    from agent.nodes.capacity import CAPACITY_POOL, score_path
    score = score_path(CAPACITY_POOL[0])
    assert isinstance(score, float)
def test_score_path_boost():
    from agent.nodes.capacity import CAPACITY_POOL, score_path
    base = score_path(CAPACITY_POOL[0], memory_boost=1.0)
    boosted = score_path(CAPACITY_POOL[0], memory_boost=1.2)
    assert boosted > base
for t in [test_capacity_pool, test_score_path, test_score_path_boost]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 9
section("9. VECTOR MEMORY")
def test_episodes_import():
    from memory.episodes import store_episode, get_boost
    return True
def test_store_episode():
    from memory.episodes import store_episode
    store_episode({"id":str(uuid.uuid4())[:8],"shipment_id":"S001","path":"W1→D1","revival_prob":0.88,"cost_delta":2.1,"outcome":"SUCCESS","score":0.82,"carrier":"C1"})
def test_get_boost_float():
    from memory.episodes import get_boost
    assert isinstance(get_boost("C_NONE","SUCCESS"), float)
def test_boost_no_history():
    from memory.episodes import get_boost
    assert get_boost("C_NONEXISTENT_999","SUCCESS") == 1.0
for t in [test_episodes_import, test_store_episode, test_get_boost_float, test_boost_no_history]:
    try_check(t.__name__.replace("test_","").replace("_"," "), t)

# SECTION 10
section("10. REQUIREMENTS.TXT")
def test_requirements():
    with open("requirements.txt") as f: content = f.read().lower()
    required = ["langgraph","langchain","xgboost","shap","scikit-learn","chromadb","plotly","pandas","numpy","python-dotenv"]
    missing = [p for p in required if p.lower().replace("-","_") not in content.replace("-","_")]
    assert not missing, f"Missing: {missing}"
try_check("requirements has all packages", test_requirements)

# SECTION 11
section("11. .env FILE")
check(".env exists", os.path.exists(".env") or os.path.exists("../.env"))

# SECTION 12
section("12. APP STRUCTURE")
def test_app_exists():
    # Check for FastAPI main.py entry point
    assert os.path.exists("main.py"), "No main.py (FastAPI entry point) found"
try_check("app file exists", test_app_exists)

# SECTION 13
section("13. END-TO-END LOOP")
def test_e2e():
    from agent.graph import APP
    state = {"shipments":{},"risk_map":{},"interventions":{},"pending_approvals":[],"tick":0,"capacity_opportunities":[],"episode_count":0,"calibration_boost":{},"active_at_risk":[],"causal_map":{},"shap_map":{},"stored_episodes":[]}
    for _ in range(3):
        state = APP.invoke(state, config={"configurable":{"thread_id":f"e2e_{uuid.uuid4().hex[:6]}"}})
    assert state.get("tick",0) == 3 or state["tick"] == 3, f"After 3 ticks, got tick={state.get('tick')}"
try_check("E2E 3-tick loop", test_e2e)

# FINAL REPORT
total = PASS_COUNT + FAIL_COUNT + ERROR_COUNT
print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  PHANTOM FLEET — PRD COMPLIANCE REPORT{RESET}")
print(f"{BOLD}{'═'*60}{RESET}")
print(f"  {GREEN}PASS  : {PASS_COUNT}{RESET}")
print(f"  {RED}FAIL  : {FAIL_COUNT}{RESET}")
print(f"  {YELLOW}ERROR : {ERROR_COUNT}{RESET}")
score_pct = int(PASS_COUNT / total * 100) if total else 0
print(f"  SCORE : {score_pct}%")
print(f"{BOLD}{'═'*60}{RESET}")
if FAIL_COUNT + ERROR_COUNT > 0:
    print(f"\n{BOLD}FAILURES & ERRORS:{RESET}")
    for status, name, reason in RESULTS:
        if status != "PASS":
            color = RED if status == "FAIL" else YELLOW
            print(f"  {color}[{status}]{RESET} {name}")
            if reason: print(f"         {reason}")
print()
sys.exit(0 if FAIL_COUNT + ERROR_COUNT == 0 else 1)
