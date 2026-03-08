import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from agent.state import AgentState
from agent.nodes import observe, risk_assess, causal_reason, plan, act, learn


def build_graph():
    """
    Build the LangGraph agent with 6 nodes.
    
    Flow: observe → risk_assess → [causal_reason → plan → act → learn] → END
    """
    wf = StateGraph(AgentState)
    
    # Add nodes
    wf.add_node("observe", observe.run)
    wf.add_node("risk_assess", risk_assess.run)
    wf.add_node("causal_reason", causal_reason.run)
    wf.add_node("plan", plan.run)
    wf.add_node("act", act.run)
    wf.add_node("learn", learn.run)
    
    # Set entry point
    wf.set_entry_point("observe")
    
    # Add edges
    wf.add_edge("observe", "risk_assess")
    
    # Conditional edge: only proceed if there are at-risk shipments
    def should_continue(state: AgentState) -> str:
        if state.get("active_at_risk", []):
            return "causal_reason"
        return END
    
    wf.add_conditional_edges(
        "risk_assess",
        should_continue,
        {
            "causal_reason": "causal_reason",
            END: END
        }
    )
    
    wf.add_edge("causal_reason", "plan")
    wf.add_edge("plan", "act")
    wf.add_edge("act", "learn")
    wf.add_edge("learn", END)
    
    # Compile with memory saver
    # Note: interrupt_before=["act"] would halt execution before act node.
    # We handle human approval via POST /approve/:id API instead.
    return wf.compile(checkpointer=MemorySaver())


# Create global app instance
APP = build_graph()
