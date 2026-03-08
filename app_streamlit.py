import streamlit as st
import time
from backend.agent.graph import APP
from backend.agent.state import AgentState
import plotly.graph_objects as go

st.set_page_config(page_title="Phantom Fleet", layout="wide", page_icon="🚀")

# ── Init session state ───────────────────────────────────
if "agent_state" not in st.session_state:
    st.session_state.agent_state = {
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
        "stored_episodes": [],
    }
    st.session_state.config = {"configurable": {"thread_id": "demo"}}
    st.session_state.rescued_count = 0
    st.session_state.metrics_history = []

# ── Header ───────────────────────────────────────────────
st.title("Phantom Fleet — Autonomous Logistics Agent")
state = st.session_state.agent_state

col1, col2, col3, col4 = st.columns(4)
col1.metric("Tick", state.get("tick", 0))
col2.metric("At Risk", len(state.get("active_at_risk", [])))

# Calculate rescued count safely
shipments = state.get("shipments", {})
rescued_count = 0
for s in shipments.values():
    status = s.get("status") if isinstance(s, dict) else getattr(s, "status", None)
    if status == "RESCUED":
        rescued_count += 1

col3.metric("Rescued", rescued_count)
col4.metric("Episodes in Memory", state.get("episode_count", 0))

# ── Run one agent tick ───────────────────────────────────
if st.button("Run Next Tick") or st.session_state.get("auto_run"):
    result = APP.invoke(st.session_state.agent_state, st.session_state.config)
    st.session_state.agent_state = result

st.toggle("Auto-Run (every 5s)", key="auto_run")
if st.session_state.get("auto_run"):
    time.sleep(5)
    st.rerun()

# ── MAP PANEL ────────────────────────────────────────────
col_map, col_risk = st.columns([2, 1])

with col_map:
    st.subheader("Live Network Map")
    
    # India-scale fake coordinates for 5 nodes
    NODES = {
        "W1": (19.0760, 72.8777),   # Mumbai
        "W2": (28.6139, 77.2090),   # Delhi
        "W3": (13.0827, 80.2707),   # Chennai
        "D1": (12.9716, 77.5946),   # Bangalore
        "D2": (22.5726, 88.3639),   # Kolkata
    }
    
    fig = go.Figure()
    
    # Draw node markers
    for name, (lat, lng) in NODES.items():
        fig.add_trace(go.Scattermapbox(
            lat=[lat], lon=[lng], mode="markers+text",
            marker=dict(size=18, color="steelblue"),
            text=[name], textposition="top right",
            name=name, showlegend=False
        ))
    
    # Draw shipment dots (shipments already defined above)
    for sid, ship in shipments.items():
        # Handle both dict and dataclass
        failure_prob = ship.get("failure_prob", 0) if isinstance(ship, dict) else ship.failure_prob
        priority = ship.get("priority", "STANDARD") if isinstance(ship, dict) else ship.priority
        
        if failure_prob < 0.50:
            continue
        lat = NODES["W1"][0] + (hash(sid) % 100)/500
        lng = NODES["W1"][1] + (hash(sid) % 100)/500
        color = "red" if failure_prob > 0.75 else "orange"
        size = 16 if priority == "CRITICAL" else 10
        fig.add_trace(go.Scattermapbox(
            lat=[lat], lon=[lng], mode="markers",
            marker=dict(size=size, color=color, opacity=0.8),
            name=sid, showlegend=False,
            hovertext=f"{sid}: {failure_prob:.0%} risk"
        ))
    
    # Draw rescue paths for active interventions
    interventions = state.get("interventions", {})
    for iid, inv in interventions.items():
        # Handle both dict and dataclass
        execution = inv.get("execution") if isinstance(inv, dict) else inv.execution
        path = inv.get("path", "") if isinstance(inv, dict) else inv.path
        
        if execution in ["AUTO", "HUMAN_APPROVED"]:
            parts = path.split("→")
            if len(parts) >= 2:
                src = parts[0].strip()
                dst = parts[-1].strip()
                if src in NODES and dst in NODES:
                    fig.add_trace(go.Scattermapbox(
                        lat=[NODES[src][0], NODES[dst][0]],
                        lon=[NODES[src][1], NODES[dst][1]],
                        mode="lines",
                        line=dict(width=3, color="limegreen"),
                        name="Rescue Path", showlegend=False
                    ))
    
    fig.update_layout(
        mapbox=dict(style="open-street-map",
                    center=dict(lat=20.5937, lon=78.9629), zoom=4),
        margin=dict(l=0, r=0, t=0, b=0), height=400
    )
    st.plotly_chart(fig, use_container_width=True)

with col_risk:
    st.subheader("Risk Feed")
    at_risk = sorted(
        [(sid, s) for sid, s in shipments.items()
         if (s.get("failure_prob", 0) if isinstance(s, dict) else s.failure_prob) >= 0.50],
        key=lambda x: -(x[1].get("failure_prob", 0) if isinstance(x[1], dict) else x[1].failure_prob)
    )
    for sid, ship in at_risk[:8]:
        prob = ship.get("failure_prob", 0) if isinstance(ship, dict) else ship.failure_prob
        priority = ship.get("priority", "STANDARD") if isinstance(ship, dict) else ship.priority
        bar_len = int(prob * 10)
        bar = "█" * bar_len + "░" * (10 - bar_len)
        priority_color = {
            "CRITICAL": "🔴 CRITICAL",
            "HIGH": "🟠 HIGH",
            "STANDARD": "🟡 STANDARD"
        }
        st.write(f"{priority_color[priority]} **{sid}** "
                 f"`{bar}` {prob:.0%}")

# ── REASONING PANEL ──────────────────────────────────────
st.subheader("Agent Reasoning")
causal_map = state.get("causal_map", {})
if causal_map:
    active_at_risk = state.get("active_at_risk", [])
    top_sid = active_at_risk[0] if active_at_risk else None
    if top_sid and top_sid in causal_map:
        c = causal_map[top_sid]
        st.info(f"**Shipment {top_sid}** | Cause: `{c.get('primary_cause','?')}`"
                f" | Confidence: {c.get('confidence',0):.0%}")
        st.write(c.get("hypothesis",""))
        shap = state.get("shap_map", {}).get(top_sid, {})
        if shap:
            st.caption("Top SHAP drivers: " + str(shap))
else:
    st.success("No shipments at risk this tick.")

# ── ESCALATION CARDS ─────────────────────────────────────
pending_approvals = state.get("pending_approvals", [])
if pending_approvals:
    st.subheader("Human Approval Required")
    for iid in pending_approvals[:]:
        inv = interventions.get(iid)
        if not inv:
            continue
        
        # Handle both dict and dataclass for intervention
        shipment_id = inv.get("shipment_id") if isinstance(inv, dict) else inv.shipment_id
        ship = shipments.get(shipment_id)
        if not ship:
            continue
        
        # Extract values safely
        priority = ship.get("priority") if isinstance(ship, dict) else ship.priority
        score = inv.get("score", 0) if isinstance(inv, dict) else inv.score
        path = inv.get("path", "") if isinstance(inv, dict) else inv.path
        eta_gain = inv.get("predicted_eta_gain", 0) if isinstance(inv, dict) else inv.predicted_eta_gain
        cost_delta = inv.get("cost_delta_pct", 0) if isinstance(inv, dict) else inv.cost_delta_pct
        revival_prob = inv.get("revival_prob", 0) if isinstance(inv, dict) else inv.revival_prob
        causal_reason = inv.get("causal_reason", "") if isinstance(inv, dict) else inv.causal_reason
        
        with st.expander(f"Shipment {shipment_id} "
                         f"| {priority} | Score: {score:.2f}",
                         expanded=True):
            st.write(f"**Proposed path:** {path}")
            st.write(f"**ETA improvement:** +{eta_gain:.1f}h")
            st.write(f"**Cost increase:** +{cost_delta:.1f}%")
            st.write(f"**Revival probability:** {revival_prob:.0%}")
            st.write(f"**Why:** {causal_reason}")
            c1, c2 = st.columns(2)
            if c1.button(f"Approve", key=f"app_{iid}"):
                # Set outcome so learn node processes on next tick
                if isinstance(inv, dict):
                    inv["execution"] = "HUMAN_APPROVED"
                    inv["outcome"] = "SUCCESS"
                else:
                    inv.execution = "HUMAN_APPROVED"
                    inv.outcome = "SUCCESS"
                
                if isinstance(ship, dict):
                    ship["status"] = "RESCUED"
                else:
                    ship.status = "RESCUED"
                
                pending_approvals.remove(iid)
                st.rerun()
            if c2.button(f"Reject", key=f"rej_{iid}"):
                # Set outcome so learn node processes on next tick
                if isinstance(inv, dict):
                    inv["execution"] = "REJECTED"
                    inv["outcome"] = "FAILURE"
                else:
                    inv.execution = "REJECTED"
                    inv.outcome = "FAILURE"
                
                pending_approvals.remove(iid)
                st.rerun()

# ── METRICS CHART ─────────────────────────────────────────
with st.expander("Learning Progress"):
    if state.get("episode_count", 0) > 0:
        st.write(f"Episodes stored in memory: **{state['episode_count']}**")
        boosts = state.get("calibration_boost", {})
        if boosts:
            import pandas as pd
            df = pd.DataFrame(list(boosts.items()),
                              columns=["Carrier","Score Multiplier"])
            st.bar_chart(df.set_index("Carrier"))
            st.caption("Score multiplier > 1.0 = memory boosting this path type."
                       " < 1.0 = memory penalizing based on past failures.")
