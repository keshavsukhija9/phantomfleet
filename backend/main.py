from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
import uuid
from typing import Optional
from dotenv import load_dotenv

from agent.graph import APP
from agent.state import AgentState

# Load environment variables
load_dotenv()

app = FastAPI(title="Phantom Fleet API")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state singleton with async lock
_state: AgentState = {
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
    "stored_episodes": [],  # Changed from set to list for serialization
}
_config = {"configurable": {"thread_id": "demo"}}
_state_lock = asyncio.Lock()  # Use asyncio.Lock instead of threading.Lock


class DecisionRequest(BaseModel):
    decision: str  # "approve" or "reject"


def serialize_state(state: AgentState) -> dict:
    """Convert AgentState to JSON-serializable dict."""
    # State is already dict-based, just return it
    return {
        "shipments": state.get("shipments", {}),
        "interventions": state.get("interventions", {}),
        "risk_map": state.get("risk_map", {}),
        "pending_approvals": state.get("pending_approvals", []),
        "tick": state.get("tick", 0),
        "episode_count": state.get("episode_count", 0),
        "calibration_boost": state.get("calibration_boost", {}),
        "active_at_risk": state.get("active_at_risk", []),
        "causal_map": state.get("causal_map", {}),
        "shap_map": state.get("shap_map", {}),
        "stored_episodes": state.get("stored_episodes", []),
    }


@app.get("/")
async def root():
    return {"message": "Phantom Fleet API", "status": "running"}


@app.get("/state")
async def get_state():
    """Get current agent state without advancing tick."""
    async with _state_lock:
        return serialize_state(_state)


@app.post("/tick")
async def run_tick():
    """Run one full agent cycle and advance tick."""
    global _state
    async with _state_lock:
        try:
            print(f"[TICK] Starting tick {_state.get('tick', 0) + 1}...")
            result = await asyncio.to_thread(APP.invoke, _state, _config)
            _state = result
            print(f"[TICK] Completed tick {_state.get('tick', 0)}")
            print(f"[TICK] Shipments: {len(_state.get('shipments', {}))}, At Risk: {len(_state.get('active_at_risk', []))}")
            return serialize_state(_state)
        except Exception as e:
            print(f"[TICK ERROR] {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")


@app.post("/approve/{intervention_id}")
async def approve_intervention(intervention_id: str, request: DecisionRequest):
    """
    Human approval/rejection of an intervention.
    Sets execution and outcome so learn node can process on next tick.
    """
    global _state
    
    async with _state_lock:
        interventions = _state.get("interventions", {})
        if intervention_id not in interventions:
            raise HTTPException(status_code=404, detail="Intervention not found")
        
        inv = interventions[intervention_id]
        shipments = _state.get("shipments", {})
        ship = shipments.get(inv["shipment_id"])
        
        if request.decision == "approve":
            inv["execution"] = "HUMAN_APPROVED"
            inv["outcome"] = "SUCCESS"  # Learn node will process this
            if ship:
                ship["status"] = "RESCUED"
        elif request.decision == "reject":
            inv["execution"] = "REJECTED"
            inv["outcome"] = "FAILURE"  # Learn node will process this
        else:
            raise HTTPException(status_code=400, detail="Invalid decision")
        
        # Remove from pending approvals
        pending = _state.get("pending_approvals", [])
        if intervention_id in pending:
            pending.remove(intervention_id)
        
        # Note: Learning happens on next tick when learn node runs
        # The intervention stays in state with outcome set
        
        return serialize_state(_state)


@app.get("/stream")
async def stream_ticks():
    """Server-Sent Events stream for auto-run mode."""
    async def event_generator():
        global _state
        # Use separate config for stream to avoid conflicts
        stream_config = {"configurable": {"thread_id": f"stream_{uuid.uuid4().hex[:8]}"}}
        
        try:
            while True:
                # Deep copy state to avoid race conditions
                import copy
                async with _state_lock:
                    current_state = copy.deepcopy(_state)
                
                # Run tick outside lock to avoid blocking other endpoints
                result = await asyncio.to_thread(APP.invoke, current_state, stream_config)
                
                # Update global state with lock
                async with _state_lock:
                    _state = result
                    data = json.dumps(serialize_state(_state))
                
                yield f"data: {data}\n\n"
                
                # Wait 5 seconds before next tick
                await asyncio.sleep(5)
        except asyncio.CancelledError:
            pass
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
