# Phantom Fleet v3 - Build To-Do List

## Pre-Build Setup (5 minutes)
- [ ] Create project structure (folders: agent/, models/, simulation/, memory/)
- [ ] Create requirements.txt
- [ ] Create .env file with ANTHROPIC_API_KEY
- [ ] Install dependencies: `pip install -r requirements.txt`

---

## HOUR 1: Data + Model Foundation (0:00-1:00)

### Person A: Data Generation & Model Training
- [ ] Create `simulation/generator.py`
  - [ ] Implement SimulationEngine class with tick system
  - [ ] Add disruption schedule (ticks 3, 5, 7, 10)
  - [ ] Generate 50 shipments per tick with 8 features
  - [ ] Test: Run generator and verify output format

- [ ] Create `models/train.py`
  - [ ] Generate 5000 training samples using SimulationEngine
  - [ ] Create failure labels using heuristic rules
  - [ ] Train XGBoost classifier (100 estimators, max_depth=4)
  - [ ] Verify AUC > 0.85
  - [ ] Save model.pkl
  - [ ] Commit model.pkl to repo

- [ ] Create `models/predict.py`
  - [ ] Load pre-trained model
  - [ ] Initialize SHAP explainer
  - [ ] Implement predict() function returning (prob, top3_shap)

### Person B: Streamlit Skeleton & Map
- [ ] Create `app.py` basic structure
  - [ ] Set up page config and session state
  - [ ] Add header with 4 metrics columns
  - [ ] Add "Run Next Tick" button and auto-run toggle
  - [ ] Test: Launch app and verify UI loads

- [ ] Implement map visualization
  - [ ] Create build_map() function with India coordinates
  - [ ] Add node markers (W1-W3, D1-D2)
  - [ ] Add shipment dots (color by risk level)
  - [ ] Add rescue path lines
  - [ ] Test: Display static map

---

## HOUR 2: Agent Core (1:00-2:00)

### Person A: LangGraph Setup
- [ ] Create `agent/state.py`
  - [ ] Define Shipment dataclass (8 core fields)
  - [ ] Define Intervention dataclass
  - [ ] Define AgentState dataclass
  - [ ] Test: Import and instantiate state

- [ ] Create `agent/graph.py`
  - [ ] Import all node functions
  - [ ] Build StateGraph with 6 nodes
  - [ ] Add edges: observe→risk_assess→causal_reason→plan→act→learn
  - [ ] Add conditional edge from risk_assess
  - [ ] Set interrupt_before=["act"] for human approval
  - [ ] Compile with MemorySaver
  - [ ] Test: Verify graph compiles without errors

- [ ] Create `agent/nodes/observe.py`
  - [ ] Initialize SimulationEngine
  - [ ] Implement run() to ingest telemetry
  - [ ] Update state.shipments and state.tick
  - [ ] Test: Run observe node standalone

- [ ] Create `agent/nodes/risk_assess.py`
  - [ ] Import predict function
  - [ ] Run XGBoost on all shipments
  - [ ] Flag shipments with prob >= 0.75
  - [ ] Store SHAP values in state.shap_map
  - [ ] Test: Verify risk scoring works

### Person B: Claude Integration & Capacity
- [ ] Create `agent/nodes/causal_reason.py`
  - [ ] Set up Anthropic client with API key
  - [ ] Write system prompt for causal reasoning
  - [ ] Implement run() to call Claude for top 3 at-risk shipments
  - [ ] Parse JSON response (hypothesis, primary_cause, confidence)
  - [ ] Store results in state.causal_map
  - [ ] Test: Make test API call and verify response format

- [ ] Create `agent/nodes/plan.py`
  - [ ] Define CAPACITY_POOL with 5 hard-coded opportunities
  - [ ] Implement score_path() function
  - [ ] Create Intervention objects for top 3 at-risk shipments
  - [ ] Apply memory boost from state.calibration_boost
  - [ ] Test: Verify intervention creation

---

## HOUR 3: Act + Learn (2:00-3:00)

### Person A: Execution & Guardrails
- [ ] Create `agent/nodes/act.py`
  - [ ] Implement 4 guardrail checks:
    - [ ] score >= 0.70
    - [ ] cost_delta_pct <= 5.0
    - [ ] priority != CRITICAL
    - [ ] revival_prob >= 0.65
  - [ ] Auto-execute if all pass
  - [ ] Add to pending_approvals if any fail
  - [ ] Update shipment status to RESCUED
  - [ ] Test: Verify auto-execution and escalation logic

### Person B: Learning Loop & Memory
- [ ] Create `memory/episodes.py`
  - [ ] Initialize Chroma client and collection
  - [ ] Implement store_episode() function
  - [ ] Implement get_boost() function
  - [ ] Query past episodes by carrier
  - [ ] Calculate success rate and return multiplier (0.8-1.2)
  - [ ] Test: Store and retrieve test episodes

- [ ] Create `agent/nodes/learn.py`
  - [ ] Import memory functions
  - [ ] Store completed interventions in Chroma
  - [ ] Update state.calibration_boost for each carrier
  - [ ] Increment state.episode_count
  - [ ] Test: Verify memory storage and boost calculation

- [ ] Add escalation UI to `app.py`
  - [ ] Display pending_approvals as expandable cards
  - [ ] Show intervention details (path, ETA gain, cost, reason)
  - [ ] Add Approve/Reject buttons
  - [ ] Update intervention execution status on click
  - [ ] Test: Trigger escalation and approve/reject

---

## HOUR 4: Integration + Demo Polish (3:00-4:00)

### Everyone: Wire Everything Together
- [ ] Connect agent graph to Streamlit app
  - [ ] Call APP.invoke() on button click
  - [ ] Update session state with result
  - [ ] Test: Run full tick cycle

- [ ] Complete app.py panels
  - [ ] Risk Feed panel (top 8 at-risk shipments)
  - [ ] Agent Reasoning panel (show causal hypothesis)
  - [ ] Learning Progress panel (show calibration boosts)
  - [ ] Test: Verify all panels display correctly

- [ ] Bug fixes and polish
  - [ ] Fix any import errors
  - [ ] Handle edge cases (empty lists, missing keys)
  - [ ] Add error handling for Claude API calls
  - [ ] Verify map updates with new data

- [ ] End-to-end demo test
  - [ ] Run Tick 1: Verify 50 shipments appear
  - [ ] Run Tick 3: Verify C4 degradation shows red shipments
  - [ ] Run Tick 4: Verify Claude reasoning appears
  - [ ] Verify AUTO execution for low-risk shipments
  - [ ] Verify escalation card for CRITICAL shipments
  - [ ] Approve escalation and verify status change
  - [ ] Run Tick 7: Verify warehouse congestion event
  - [ ] Check Learning panel for non-1.0 multipliers

---

## Pre-Demo Checklist (Run before presenting)
- [ ] `python models/train.py` → model.pkl exists, AUC > 0.85
- [ ] `streamlit run app.py` → no import errors
- [ ] Tick 1-10 run without crashes
- [ ] Claude API calls work (reasoning panel shows text)
- [ ] At least 1 AUTO execution visible
- [ ] At least 1 escalation card appears for CRITICAL
- [ ] Episode count increments
- [ ] Score multipliers show in Learning panel
- [ ] Can walk through graph.py node topology
- [ ] Can show Claude prompt in causal_reason.py

---

## Judge Q&A Prep
- [ ] Practice explaining: "Not rule-based - XGBoost + Claude API"
- [ ] Practice showing: Learning panel with score multipliers
- [ ] Practice demonstrating: Guardrails preventing CRITICAL auto-execution
- [ ] Practice walking through: Observe→Reason→Decide→Act→Learn flow
- [ ] Prepare answer: "What would you add?" → A*, 22 features, Monte Carlo, Bayesian calibration

---

## Git & Submission
- [ ] `git init && git add . && git commit -m "Phantom Fleet v3"`
- [ ] Push to public GitHub
- [ ] Verify repo is accessible
- [ ] Add README with setup instructions

---

## If Running Out of Time - CUT THESE:
- ❌ Monte Carlo simulation
- ❌ OR-Tools path optimization
- ❌ Re-plan loop
- ❌ Fancy map animations
- ❌ SSE streaming

## NEVER CUT:
- ✅ Claude API call in CausalReasonNode
- ✅ XGBoost with SHAP
- ✅ Escalation card for CRITICAL
- ✅ Chroma episode storage
- ✅ LangGraph structure
- ✅ calibration_boost changing over time
