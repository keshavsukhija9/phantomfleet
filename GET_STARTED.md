# 🚀 Get Started with Phantom Fleet

## Quick Start (5 Minutes)

### Step 1: Set Your API Key
Edit the `.env` file:
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Step 2: Run the Quick Start Script

**Windows:**
```bash
quick_start.bat
```

**Linux/Mac:**
```bash
chmod +x quick_start.sh
./quick_start.sh
```

This will:
1. Install all dependencies
2. Train the XGBoost model (~3 minutes)
3. Run system tests
4. Start the FastAPI server

### Step 3: Test the API

Open a new terminal and try:

```bash
# Get current state
curl http://localhost:8000/state

# Run one tick
curl -X POST http://localhost:8000/tick

# Run 10 ticks to see disruptions
for i in {1..10}; do 
  echo "Tick $i"
  curl -X POST http://localhost:8000/tick -s | grep -o '"tick":[0-9]*'
  sleep 1
done
```

## What You'll See

### Tick 1-2: Normal Operations
- 50 shipments generated
- Low risk levels
- No interventions needed

### Tick 3: Carrier Degradation 🚨
- Carrier C4 reliability drops to 0.25
- Multiple shipments flagged AT_RISK
- Claude generates causal hypotheses
- Interventions planned and executed

### Tick 5: Weather Event 🌧️
- Weather risk spikes to 0.78
- More shipments at risk
- Different causal reasoning

### Tick 7: Warehouse Congestion 📦
- Warehouse W3 pressure → 0.91
- Compound risk factors
- Human approval required for CRITICAL

### Tick 10: Compound Event ⚠️
- Multiple simultaneous disruptions
- Learning system adjusts scoring
- Calibration boosts visible

## Explore the API

### Interactive Docs
Open in browser: `http://localhost:8000/docs`

Try the endpoints:
- GET `/state` - Current system state
- POST `/tick` - Run one cycle
- POST `/approve/{id}` - Approve intervention
- GET `/stream` - Auto-run mode (SSE)

### Example: Approve an Intervention

```bash
# 1. Run a few ticks until you get a PENDING_HUMAN
curl -X POST http://localhost:8000/tick

# 2. Get the state and find pending approvals
curl http://localhost:8000/state | grep -A 5 "pending_approvals"

# 3. Approve it (replace with actual ID)
curl -X POST http://localhost:8000/approve/abc12345 \
  -H "Content-Type: application/json" \
  -d '{"decision": "approve"}'
```

## Understanding the Output

### State Structure
```json
{
  "tick": 5,
  "shipments": {
    "S001": {
      "id": "S001",
      "carrier": "C4",
      "priority": "CRITICAL",
      "status": "AT_RISK",
      "failure_prob": 0.87,
      ...
    }
  },
  "risk_map": {
    "S001": 0.87,
    ...
  },
  "causal_map": {
    "S001": {
      "hypothesis": "Shipment at 87% risk because carrier C4 reliability dropped to 0.25...",
      "primary_cause": "CARRIER_DEGRADATION",
      "confidence": 0.92
    }
  },
  "interventions": {
    "abc123": {
      "shipment_id": "S001",
      "path": "W3→D2",
      "execution": "PENDING_HUMAN",
      "score": 0.78,
      ...
    }
  },
  "episode_count": 12,
  "calibration_boost": {
    "S001": 1.15,
    ...
  }
}
```

### Key Fields to Watch

**shipments** - All 50 shipments with risk scores
**active_at_risk** - IDs of shipments above 0.75 threshold
**causal_map** - Claude's reasoning for each at-risk shipment
**interventions** - Planned reroutes with scores
**pending_approvals** - Interventions waiting for human decision
**episode_count** - Total stored in memory
**calibration_boost** - Learning multipliers (0.8-1.2)

## Verify Learning

Run 15+ ticks and watch the calibration_boost change:

```bash
# Run 15 ticks
for i in {1..15}; do 
  curl -X POST http://localhost:8000/tick -s > /dev/null
  echo "Tick $i complete"
done

# Check learning
curl http://localhost:8000/state | grep -A 10 "calibration_boost"
```

You should see values != 1.0, showing the system learned from past interventions.

## Performance Check

Time a single tick:

```bash
time curl -X POST http://localhost:8000/tick -s > /dev/null
```

Expected: 8-15 seconds total
- Most time is Claude API (2-6s)
- XGBoost + SHAP: <500ms
- Everything else: <1s

## Troubleshooting

### "CUDA not available"
Your GPU isn't detected. The system will work on CPU (slower).

Fix:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### "Model not found"
Run training:
```bash
cd backend && python models/train.py
```

### "Anthropic API error"
Check your API key in `.env` file.

### "Import errors"
Make sure you're in the correct directory:
```bash
cd backend
python test_system.py
```

## Next Steps

### 1. Run the Full Demo
```bash
# Terminal 1: Start server
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Run demo sequence
for i in {1..10}; do
  echo "=== TICK $i ==="
  curl -X POST http://localhost:8000/tick -s | \
    jq '{tick, at_risk: .active_at_risk | length, interventions: .interventions | length, episodes: .episode_count}'
  sleep 2
done
```

### 2. Explore the Code
- `backend/agent/graph.py` - See the 6-node pipeline
- `backend/agent/nodes/causal_reason.py` - Claude API integration
- `backend/models/predict.py` - XGBoost + SHAP
- `backend/memory/episodes.py` - Learning mechanism

### 3. Build the Frontend
The backend is ready for any frontend:
- React (as per original PRD)
- Vue, Angular, Svelte
- Even a CLI tool

API contract is stable and documented.

### 4. Customize
- Add more capacity opportunities in `capacity.py`
- Adjust guardrails in `act.py`
- Modify disruption schedule in `generator.py`
- Tune XGBoost hyperparameters in `train.py`

## Documentation

- `README.md` - Main overview
- `SETUP_INSTRUCTIONS.md` - Detailed setup
- `VALIDATION_CHECKLIST.md` - Testing guide
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `TODO.md` - Original build checklist

## Support

Check the validation checklist if something doesn't work:
```bash
cat VALIDATION_CHECKLIST.md
```

Run the automated tests:
```bash
cd backend && python test_system.py
```

## Demo for Judges

1. Show the agent graph: `backend/agent/graph.py`
2. Run ticks 1-10 showing disruptions
3. Point out Claude reasoning in causal_map
4. Show AUTO vs PENDING_HUMAN execution
5. Demonstrate learning with calibration_boost
6. Approve a CRITICAL intervention
7. Explain the 4 guardrails

**Key Message**: This is a complete ORDAL loop with real ML, real AI reasoning, and real learning. Not rule-based, not mocked.

---

**You're ready to go! 🎉**

Start the server and run your first tick:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Then in another terminal:
```bash
curl -X POST http://localhost:8000/tick
```
