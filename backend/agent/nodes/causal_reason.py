import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from pydantic import BaseModel, Field
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agent.state import AgentState
from dotenv import load_dotenv

load_dotenv()


# ═══════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMA - Enforces strict JSON structure
# ═══════════════════════════════════════════════════════════════════════════

class CausalHypothesisSchema(BaseModel):
    """
    Strict schema for causal reasoning output.
    Llama-3-8B will be forced to output valid JSON matching this structure.
    """
    hypothesis: str = Field(
        description="2-3 sentence causal narrative explaining WHY this shipment is at risk. "
                    "Must cite specific feature values from the data."
    )
    primary_cause: str = Field(
        description="Must be EXACTLY one of: CARRIER_DEGRADATION, WAREHOUSE_CONGESTION, "
                    "WEATHER, DOWNSTREAM_PRESSURE, COMPOUND, TIMING_CRITICAL, UNKNOWN"
    )
    contributing_factors: list[str] = Field(
        description="List of 1-3 secondary risk factors (e.g., 'high warehouse pressure', 'low handoff margin')",
        default_factory=list
    )
    confidence: float = Field(
        description="Confidence in this hypothesis, between 0.0 and 1.0",
        ge=0.0,
        le=1.0
    )
    expected_failure_mode: str = Field(
        description="What happens if no action is taken (e.g., 'missed delivery SLA', 'customer escalation')",
        default="delivery failure"
    )
    evidence_citations: list[str] = Field(
        description="Specific data points cited (e.g., 'eta_drift_pct=45.2', 'carrier_reliability=0.23')",
        default_factory=list
    )


# ═══════════════════════════════════════════════════════════════════════════
# HUGGING FACE LLM SETUP - Llama-3-8B-Instruct via ChatHuggingFace
# ═══════════════════════════════════════════════════════════════════════════

_llm_instance = None  # Cache LLM instance

def get_llm():
    """
    Initialize ChatHuggingFace with Llama-3-8B-Instruct.
    Uses ChatHuggingFace (conversational API) instead of HuggingFaceEndpoint
    (text-generation API) because providers like Novita only support the
    conversational task for instruct models.
    Falls back to None if token is missing or API fails.
    """
    global _llm_instance
    
    if _llm_instance is not None:
        return _llm_instance
    
    hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN", "")
    
    if not hf_token or hf_token == "your_hf_token_here":
        print("⚠️  HUGGINGFACEHUB_API_TOKEN not set. Using fallback mode.")
        return None
    
    try:
        # Create the underlying endpoint
        endpoint = HuggingFaceEndpoint(
            repo_id="meta-llama/Meta-Llama-3-8B-Instruct",
            max_new_tokens=512,
            temperature=0.1,
            do_sample=False,
            repetition_penalty=1.1,
            huggingfacehub_api_token=hf_token,
        )
        # Wrap with ChatHuggingFace for conversational API support
        _llm_instance = ChatHuggingFace(llm=endpoint)
        print("✓ Llama-3-8B-Instruct initialized via ChatHuggingFace")
        return _llm_instance
    except Exception as e:
        print(f"⚠️  Hugging Face API error: {e}")
        print("⚠️  Using fallback mode (rule-based reasoning)")
        return None


# ═══════════════════════════════════════════════════════════════════════════
# JSON OUTPUT PARSER - Enforces schema compliance
# ═══════════════════════════════════════════════════════════════════════════

parser = JsonOutputParser(pydantic_object=CausalHypothesisSchema)


# ═══════════════════════════════════════════════════════════════════════════
# PROMPT TEMPLATE - Chat-style prompt for ChatHuggingFace
# ═══════════════════════════════════════════════════════════════════════════

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are Phantom Fleet's Causal Reasoning Engine for logistics risk analysis.

Your task: Analyze shipment telemetry and SHAP feature importance to produce a causal hypothesis explaining WHY a shipment is at risk.

CRITICAL RULES:
1. Every causal claim MUST cite specific numbers from the provided data
2. Use the SHAP values to identify the PRIMARY driver (highest absolute SHAP value)
3. Respond ONLY with valid JSON - no conversational text, no markdown, no explanations
4. The primary_cause must be EXACTLY one of these 7 categories:
   - CARRIER_DEGRADATION (carrier reliability < 0.4)
   - WAREHOUSE_CONGESTION (warehouse pressure > 0.7)
   - WEATHER (weather risk > 0.6)
   - DOWNSTREAM_PRESSURE (downstream critical > 1)
   - TIMING_CRITICAL (handoff margin < 2.0 hours)
   - COMPOUND (multiple factors above thresholds)
   - UNKNOWN (insufficient data)

{format_instructions}"""),
    ("human", """SHIPMENT ANALYSIS REQUEST:

Shipment ID: {shipment_id}
Priority: {priority}
Failure Probability: {failure_prob:.1%}

FEATURE VALUES:
- eta_drift_pct: {eta_drift}%
- carrier_reliability: {carrier_rel:.2f}
- warehouse_pressure: {warehouse_press:.2f}
- weather_risk: {weather:.2f}
- handoff_margin_hours: {handoff:.1f}
- downstream_critical: {downstream}
- priority_score: {priority_score:.2f}

TOP SHAP DRIVERS (what the model reacted to most):
{shap_features}

Produce your causal hypothesis as valid JSON."""),
]).partial(format_instructions=parser.get_format_instructions())


# ═══════════════════════════════════════════════════════════════════════════
# FALLBACK FUNCTION - Rule-based reasoning when LLM unavailable
# ═══════════════════════════════════════════════════════════════════════════

def generate_fallback_hypothesis(ship, shap_top3):
    """
    Rule-based causal reasoning when Hugging Face API is unavailable.
    Uses SHAP values and feature thresholds to determine primary cause.
    """
    # Determine primary cause from features
    if ship["carrier_reliability"] < 0.4:
        primary_cause = "CARRIER_DEGRADATION"
        hypothesis = f"Shipment {ship['id']} is at risk due to carrier {ship['carrier']} reliability degradation to {ship['carrier_reliability']:.2f}. "
    elif ship["warehouse_pressure"] > 0.7:
        primary_cause = "WAREHOUSE_CONGESTION"
        hypothesis = f"Shipment {ship['id']} is at risk due to warehouse congestion (pressure: {ship['warehouse_pressure']:.2f}). "
    elif ship["weather_risk"] > 0.6:
        primary_cause = "WEATHER"
        hypothesis = f"Shipment {ship['id']} is at risk due to severe weather conditions (risk: {ship['weather_risk']:.2f}). "
    elif ship["handoff_margin_hours"] < 2.0:
        primary_cause = "TIMING_CRITICAL"
        hypothesis = f"Shipment {ship['id']} is at risk due to tight handoff margin ({ship['handoff_margin_hours']:.1f}h). "
    elif ship["downstream_critical"] > 1:
        primary_cause = "DOWNSTREAM_PRESSURE"
        hypothesis = f"Shipment {ship['id']} is at risk due to {ship['downstream_critical']} critical downstream dependencies. "
    else:
        primary_cause = "COMPOUND"
        hypothesis = f"Shipment {ship['id']} is at risk due to multiple compounding factors. "
    
    # Add ETA drift context
    if ship["eta_drift_pct"] > 30:
        hypothesis += f"Current ETA drift is {ship['eta_drift_pct']:.1f}%, significantly behind schedule."
    
    # Extract contributing factors from SHAP
    contributing_factors = [f"{k}: {v:+.3f}" for k, v in list(shap_top3.items())[:3]]
    
    # Build evidence citations
    evidence_citations = [
        f"eta_drift_pct={ship['eta_drift_pct']:.1f}%",
        f"carrier_reliability={ship['carrier_reliability']:.2f}",
        f"warehouse_pressure={ship['warehouse_pressure']:.2f}",
        f"weather_risk={ship['weather_risk']:.2f}",
    ]
    
    return {
        "hypothesis": hypothesis,
        "primary_cause": primary_cause,
        "contributing_factors": contributing_factors,
        "confidence": 0.75,  # Rule-based has moderate confidence
        "expected_failure_mode": "missed delivery SLA" if ship["priority"] == "CRITICAL" else "delayed delivery",
        "evidence_citations": evidence_citations,
    }


# ═══════════════════════════════════════════════════════════════════════════
# LANGGRAPH NODE - Main causal reasoning function
# ═══════════════════════════════════════════════════════════════════════════

def run(state: AgentState) -> AgentState:
    """
    CausalReasonNode: Generate causal hypotheses for at-risk shipments.
    
    Uses Llama-3-8B-Instruct via Hugging Face with strict JSON parsing.
    Falls back to rule-based reasoning if API unavailable.
    """
    active_at_risk = state.get("active_at_risk", [])
    shipments = state.get("shipments", {})
    shap_map = state.get("shap_map", {})
    causal_map = dict(state.get("causal_map", {}))
    
    # Initialize LLM (cached after first call)
    llm = get_llm()
    
    # Build chain if LLM available
    if llm:
        causal_chain = prompt | llm | parser
    
    # Process top 3 at-risk shipments
    for sid in active_at_risk[:3]:
        ship = shipments[sid]
        shap_top3 = shap_map.get(sid, {})
        
        # Format SHAP features for prompt
        shap_features = "\n".join([
            f"  - {feature}: {value:+.3f} SHAP impact"
            for feature, value in list(shap_top3.items())[:5]
        ])
        
        try:
            if llm:
                # Use Llama-3-8B via Hugging Face
                result = causal_chain.invoke({
                    "shipment_id": sid,
                    "priority": ship["priority"],
                    "failure_prob": ship["failure_prob"],
                    "eta_drift": ship["eta_drift_pct"],
                    "carrier_rel": ship["carrier_reliability"],
                    "warehouse_press": ship["warehouse_pressure"],
                    "weather": ship["weather_risk"],
                    "handoff": ship["handoff_margin_hours"],
                    "downstream": ship["downstream_critical"],
                    "priority_score": ship["priority_score"],
                    "shap_features": shap_features,
                })
                
                # Store result
                causal_map[sid] = result
                print(f"✓ Llama-3-8B hypothesis for {sid}: {result['primary_cause']}")
            else:
                # Use fallback rule-based reasoning
                result = generate_fallback_hypothesis(ship, shap_top3)
                causal_map[sid] = result
                print(f"⚠️  Fallback hypothesis for {sid}: {result['primary_cause']}")
        
        except Exception as e:
            # Fallback on any error
            print(f"⚠️  Error generating hypothesis for {sid}: {e}")
            result = generate_fallback_hypothesis(ship, shap_top3)
            causal_map[sid] = result
    
    return {
        **state,
        "causal_map": causal_map,
    }
