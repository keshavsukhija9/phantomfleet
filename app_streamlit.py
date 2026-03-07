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
col3.metric("Rescued", sum(1 for s in state.get("shipments", {}).values()
                            if s.status == "RESCUED"))
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
    
    # Draw shipment dots
    shipments = state.get("shipments", {})
    for sid, ship in shipments.items():
        if ship.failure_prob < 0.50:
            continue
        lat = NODES["W1"][0] + (hash(sid) % 100)/500
        lng = NODES["W1"][1] + (hash(sid) % 100)/500
        color = "red" if ship.failure_prob > 0.75 else "orange"
        size = 16 if ship.priority == "CRITICAL" else 10
        fig.add_trace(go.Scattermapbox(
            lat=[lat], lon=[lng], mode="markers",
            marker=dict(size=size, color=color, opacity=0.8),
            name=sid, showlegend=False,
            hovertext=f"{sid}: {ship.failure_prob:.0%} risk"
        ))
    
    # Draw rescue paths for active interventions
    interventions = state.get("interventions", {})
    for iid, inv in interventions.items():
        if inv.execution in ["AUTO", "HUMAN_APPROVED"]:
            parts = inv.path.split("→")
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
         if s.failure_prob >= 0.50],
        key=lambda x: -x[1].failure_prob
    )
    for sid, ship in at_risk[:8]:
        bar_len = int(ship.failure_prob * 10)
        bar = "█" * bar_len + "░" * (10 - bar_len)
        priority_color = {
            "CRITICAL": "🔴 CRITICAL",
            "HIGH": "🟠 HIGH",
            "STANDARD": "🟡 STANDARD"
        }
        st.write(f"{priority_color[ship.priority]} **{sid}** "
                 f"`{bar}` {ship.failure_prob:.0%}")

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
        ship = shipments.get(inv.shipment_id)
        with st.expander(f"Shipment {inv.shipment_id} "
                         f"| {ship.priority} | Score: {inv.score:.2f}",
                         expanded=True):
            st.write(f"**Proposed path:** {inv.path}")
            st.write(f"**ETA improvement:** +{inv.predicted_eta_gain:.1f}h")
            st.write(f"**Cost increase:** +{inv.cost_delta_pct:.1f}%")
            st.write(f"**Revival probability:** {inv.revival_prob:.0%}")
            st.write(f"**Why:** {inv.causal_reason}")
            c1, c2 = st.columns(2)
            if c1.button(f"Approve", key=f"app_{iid}"):
                inv.execution = "HUMAN_APPROVED"
                inv.outcome = "SUCCESS"
                ship.status = "RESCUED"
                pending_approvals.remove(iid)
                st.rerun()
            if c2.button(f"Reject", key=f"rej_{iid}"):
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
                              columns=["Shipment","Score Multiplier"])
            st.bar_chart(df.set_index("Shipment"))
            st.caption("Score multiplier > 1.0 = memory boosting this path type."
                       " < 1.0 = memory penalizing based on past failures.")
