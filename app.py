import streamlit as st
import requests
import time
import plotly.graph_objects as go
import pandas as pd

# Configure page
st.set_page_config(
    page_title="Phantom Fleet",
    layout="wide",
    page_icon="🚀"
)

# Backend API URL
API_BASE = "http://localhost:8000"

# Initialize session state
if "auto_run" not in st.session_state:
    st.session_state.auto_run = False
if "last_tick" not in st.session_state:
    st.session_state.last_tick = 0


def get_state():
    """Fetch current state from backend."""
    try:
        response = requests.get(f"{API_BASE}/state", timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Failed to fetch state: {e}")
        return None


def run_tick():
    """Run one agent cycle."""
    try:
        response = requests.post(f"{API_BASE}/tick", timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Failed to run tick: {e}")
        return None


def approve_intervention(intervention_id, decision):
    """Approve or reject an intervention."""
    try:
        response = requests.post(
            f"{API_BASE}/approve/{intervention_id}",
            json={"decision": decision},
            timeout=5
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Failed to {decision} intervention: {e}")
        return None


def build_map(state):
    """Build Plotly map visualization."""
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
            lat=[lat],
            lon=[lng],
            mode="markers+text",
            marker=dict(size=18, color="steelblue"),
            text=[name],
            textposition="top right",
            name=name,
            showlegend=False
        ))
    
    # Draw shipment dots
    shipments = state.get("shipments", {})
    for sid, ship in shipments.items():
        if ship.get("failure_prob", 0) < 0.50:
            continue
        
        lat = NODES["W1"][0] + (hash(sid) % 100) / 500
        lng = NODES["W1"][1] + (hash(sid) % 100) / 500
        color = "red" if ship.get("failure_prob", 0) > 0.75 else "orange"
        size = 16 if ship.get("priority") == "CRITICAL" else 10
        
        fig.add_trace(go.Scattermapbox(
            lat=[lat],
            lon=[lng],
            mode="markers",
            marker=dict(size=size, color=color, opacity=0.8),
            name=sid,
            showlegend=False,
            hovertext=f"{sid}: {ship.get('failure_prob', 0):.0%} risk"
        ))
    
    # Draw rescue paths for active interventions
    interventions = state.get("interventions", {})
    for iid, inv in interventions.items():
        if inv.get("execution") in ["AUTO", "HUMAN_APPROVED"]:
            path = inv.get("path", "")
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
                        name="Rescue Path",
                        showlegend=False
                    ))
    
    fig.update_layout(
        mapbox=dict(
            style="open-street-map",
            center=dict(lat=20.5937, lon=78.9629),
            zoom=4
        ),
        margin=dict(l=0, r=0, t=0, b=0),
        height=400
    )
    
    return fig


# ═══════════════════════════════════════════════════════════
# HEADER
# ═══════════════════════════════════════════════════════════

st.title("🚀 Phantom Fleet — Autonomous Logistics Agent")

# Fetch current state
state = get_state()

if state is None:
    st.error("⚠️ Backend not responding. Make sure the FastAPI server is running:")
    st.code("cd backend && uvicorn main:app --reload --port 8000")
    st.stop()

# Metrics row
col1, col2, col3, col4 = st.columns(4)

shipments = state.get("shipments", {})
rescued_count = sum(1 for s in shipments.values() if s.get("status") == "RESCUED")

col1.metric("Tick", state.get("tick", 0))
col2.metric("At Risk", len(state.get("active_at_risk", [])))
col3.metric("Rescued", rescued_count)
col4.metric("Episodes in Memory", state.get("episode_count", 0))

# Control buttons
col_btn1, col_btn2 = st.columns([1, 3])

with col_btn1:
    if st.button("▶️ Run Next Tick", use_container_width=True):
        with st.spinner("Running agent cycle..."):
            new_state = run_tick()
            if new_state:
                st.session_state.last_tick = new_state.get("tick", 0)
                st.rerun()

with col_btn2:
    auto_run = st.toggle("🔄 Auto-Run (every 5s)", value=st.session_state.auto_run)
    st.session_state.auto_run = auto_run

# Auto-run logic
if st.session_state.auto_run:
    time.sleep(5)
    with st.spinner("Auto-running tick..."):
        new_state = run_tick()
        if new_state:
            st.session_state.last_tick = new_state.get("tick", 0)
    st.rerun()

st.divider()

# ═══════════════════════════════════════════════════════════
# MAP AND RISK FEED
# ═══════════════════════════════════════════════════════════

col_map, col_risk = st.columns([2, 1])

with col_map:
    st.subheader("📍 Live Network Map")
    fig = build_map(state)
    st.plotly_chart(fig, use_container_width=True)

with col_risk:
    st.subheader("⚠️ Risk Feed")
    
    # Get at-risk shipments
    at_risk = [
        (sid, ship) for sid, ship in shipments.items()
        if ship.get("failure_prob", 0) >= 0.50
    ]
    at_risk.sort(key=lambda x: -x[1].get("failure_prob", 0))
    
    if at_risk:
        for sid, ship in at_risk[:8]:
            prob = ship.get("failure_prob", 0)
            priority = ship.get("priority", "STANDARD")
            
            # ASCII progress bar
            bar_len = int(prob * 10)
            bar = "█" * bar_len + "░" * (10 - bar_len)
            
            # Priority badge
            if priority == "CRITICAL":
                badge = "🔴 CRITICAL"
            elif priority == "HIGH":
                badge = "🟠 HIGH"
            else:
                badge = "🟡 STANDARD"
            
            st.markdown(f"{badge} **{sid}**")
            st.code(f"{bar} {prob:.0%}")
    else:
        st.success("✅ No shipments at risk")

st.divider()

# ═══════════════════════════════════════════════════════════
# AGENT REASONING
# ═══════════════════════════════════════════════════════════

st.subheader("🧠 Agent Reasoning")

causal_map = state.get("causal_map", {})
active_at_risk = state.get("active_at_risk", [])

if causal_map and active_at_risk:
    top_sid = active_at_risk[0]
    
    if top_sid in causal_map:
        causal = causal_map[top_sid]
        ship = shipments.get(top_sid, {})
        
        # Display causal reasoning
        primary_cause = causal.get("primary_cause", "UNKNOWN")
        confidence = causal.get("confidence", 0)
        hypothesis = causal.get("hypothesis", "")
        
        st.info(f"**Shipment {top_sid}** | Cause: `{primary_cause}` | Confidence: {confidence:.0%}")
        st.write(hypothesis)
        
        # Show SHAP drivers
        shap_map = state.get("shap_map", {})
        if top_sid in shap_map:
            shap = shap_map[top_sid]
            st.caption(f"**Top SHAP drivers:** {shap}")
else:
    st.success("✅ No shipments at risk this tick")

st.divider()

# ═══════════════════════════════════════════════════════════
# ESCALATION CARDS (Human Approval)
# ═══════════════════════════════════════════════════════════

pending_approvals = state.get("pending_approvals", [])

if pending_approvals:
    st.subheader("🚨 Human Approval Required")
    
    interventions = state.get("interventions", {})
    
    for iid in pending_approvals:
        inv = interventions.get(iid)
        if not inv:
            continue
        
        ship = shipments.get(inv.get("shipment_id", ""), {})
        priority = ship.get("priority", "UNKNOWN")
        score = inv.get("score", 0)
        
        with st.expander(
            f"🔔 Shipment {inv.get('shipment_id')} | {priority} | Score: {score:.2f}",
            expanded=True
        ):
            col_info1, col_info2 = st.columns(2)
            
            with col_info1:
                st.write(f"**Proposed path:** {inv.get('path', 'N/A')}")
                st.write(f"**ETA improvement:** +{inv.get('predicted_eta_gain', 0):.1f}h")
            
            with col_info2:
                st.write(f"**Cost increase:** +{inv.get('cost_delta_pct', 0):.1f}%")
                st.write(f"**Revival probability:** {inv.get('revival_prob', 0):.0%}")
            
            st.write(f"**Why:** {inv.get('causal_reason', 'No reason provided')}")
            
            col_btn1, col_btn2, col_btn3 = st.columns([1, 1, 2])
            
            with col_btn1:
                if st.button("✅ Approve", key=f"approve_{iid}", use_container_width=True):
                    new_state = approve_intervention(iid, "approve")
                    if new_state:
                        st.success("Approved!")
                        time.sleep(1)
                        st.rerun()
            
            with col_btn2:
                if st.button("❌ Reject", key=f"reject_{iid}", use_container_width=True):
                    new_state = approve_intervention(iid, "reject")
                    if new_state:
                        st.warning("Rejected")
                        time.sleep(1)
                        st.rerun()

st.divider()

# ═══════════════════════════════════════════════════════════
# LEARNING PROGRESS
# ═══════════════════════════════════════════════════════════

with st.expander("📊 Learning Progress", expanded=False):
    episode_count = state.get("episode_count", 0)
    
    if episode_count > 0:
        st.write(f"Episodes stored in memory: **{episode_count}**")
        
        calibration_boost = state.get("calibration_boost", {})
        
        if calibration_boost:
            df = pd.DataFrame(
                list(calibration_boost.items()),
                columns=["Carrier", "Score Multiplier"]
            )
            
            st.bar_chart(df.set_index("Carrier"))
            
            st.caption(
                "Score multiplier > 1.0 = memory boosting this carrier type. "
                "< 1.0 = memory penalizing based on past failures."
            )
        else:
            st.info("No calibration data yet. Run more ticks to see learning in action.")
    else:
        st.info("No episodes stored yet. Run a few ticks to see the learning loop in action.")

# ═══════════════════════════════════════════════════════════
# FOOTER
# ═══════════════════════════════════════════════════════════

st.divider()
st.caption("Phantom Fleet v3 | NMIMS Hackathon | Agentic AI for Logistics & Supply Chain")
