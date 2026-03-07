import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import json
from dotenv import load_dotenv
from agent.state import AgentState

# Load environment variables
load_dotenv()

# Choose LLM provider: "ollama" or "claude"
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "ollama").lower()

if LLM_PROVIDER == "ollama":
    try:
        import requests
        # Test Ollama connection
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code == 200:
            print("Using Ollama for causal reasoning")
            CLIENT = "ollama"
            OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
        else:
            print("WARNING: Ollama not responding. Falling back to mock responses.")
            CLIENT = None
    except Exception as e:
        print(f"WARNING: Could not connect to Ollama: {e}")
        print("Make sure Ollama is running: ollama serve")
        CLIENT = None
else:
    # Claude API
    import anthropic
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or api_key == "your_key_here":
        print("WARNING: ANTHROPIC_API_KEY not set or using placeholder.")
        CLIENT = None
    else:
        CLIENT = anthropic.Anthropic(api_key=api_key)
        print("Using Claude for causal reasoning")

SYSTEM = """You are Phantom Fleet's Causal Reasoning Engine for logistics.
Given shipment features and SHAP values, produce a 2-sentence causal
hypothesis explaining WHY this shipment is at risk and what will happen
if no action is taken. Be specific: cite the exact feature values.
Respond only with valid JSON: {"hypothesis": "...", "primary_cause": "...",
"confidence": 0.XX}
primary_cause must be one of: CARRIER_DEGRADATION, WAREHOUSE_CONGESTION,
WEATHER, DOWNSTREAM_PRESSURE, COMPOUND."""


def run(state: AgentState) -> AgentState:
    """
    CausalReasonNode: Call Claude API for causal reasoning.
    
    Generates hypotheses for top at-risk shipments (max 3 to save API budget).
    """
    causal_map = {}
    active_at_risk = state.get("active_at_risk", [])
    shipments = state.get("shipments", {})
    shap_map = state.get("shap_map", {})
    
    # Check if Claude client is available
    if CLIENT is None:
        print("Skipping Claude API calls - no valid API key configured")
        for sid in active_at_risk[:3]:
            ship = shipments[sid]
            causal_map[sid] = {
                "hypothesis": f"Shipment at {ship.failure_prob:.1%} risk (Claude API unavailable - set ANTHROPIC_API_KEY)",
                "primary_cause": "UNKNOWN",
                "confidence": 0.5
            }
        return {
            **state,
            "causal_map": causal_map,
        }
    
    # Cap at 3 to save API calls
    for sid in active_at_risk[:3]:
        ship = shipments[sid]
        shap = shap_map.get(sid, {})
        
        prompt = f"""
Shipment {sid} | Priority: {ship.priority}
Failure probability: {ship.failure_prob:.1%}

Feature values:
  eta_drift_pct       = {ship.eta_drift_pct:.1f}%
  carrier_reliability = {ship.carrier_reliability:.2f}
  warehouse_pressure  = {ship.warehouse_pressure:.2f}
  weather_risk        = {ship.weather_risk:.2f}

Top SHAP drivers (what the model reacted to most):
  {shap}

Produce your causal hypothesis as JSON."""

        try:
            resp = CLIENT.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=200,
                system=SYSTEM,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Try to parse JSON from response
            text = resp.content[0].text.strip()
            # Handle markdown code blocks
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            
            result = json.loads(text)
        except json.JSONDecodeError as e:
            print(f"Claude JSON parse error for {sid}: {e}")
            print(f"Response was: {text[:200]}")
            result = {
                "hypothesis": f"Shipment at risk due to elevated failure probability ({ship.failure_prob:.1%})",
                "primary_cause": "UNKNOWN",
                "confidence": 0.5
            }
        except Exception as e:
            print(f"Claude API error for {sid}: {e}")
            result = {
                "hypothesis": f"Shipment at risk due to elevated failure probability ({ship.failure_prob:.1%})",
                "primary_cause": "UNKNOWN",
                "confidence": 0.5
            }
        
        causal_map[sid] = result
    
    return {
        **state,
        "causal_map": causal_map,
    }
