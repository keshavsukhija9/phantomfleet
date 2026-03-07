# Phantom Fleet - System Validation Checklist

Use this checklist to verify the complete backend system is working correctly.

## Pre-Flight Checks

### Environment Setup
- [ ] Python 3.10+ installed
- [ ] CUDA toolkit installed (check: `nvidia-smi`)
- [ ] `.env` file created with valid `ANTHROPIC_API_KEY`
- [ ] All dependencies installed: `pip install -r backend/requirements.txt`

### GPU Verification
```bash
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```
Expected: `CUDA available: True`

## Component Tests

### 1. Simulation Engine
```bash
cd backend
python -c "from simulation.generator import SimulationEngine; e = SimulationEngine(); s = e.step(); print(f'Generated {len(s)} shipments')"
```
Expected: `Generated 50 shipments`

### 2. Model Training
```bash
cd backend
python models/train.py
```
Expected output:
- `Generating training data...`
- `Training XGBoost model with GPU acceleration...`
- `AUC: 0.XXX` (should be > 0.85)
- `Model saved to .../model.pkl`

### 3. Model Inference
```bash
cd backend
python -c "from models.predict import predict; prob, shap = predict({'eta_drift_pct': 45, 'carrier_reliability': 0.3, 'warehouse_pressure': 0.85, 'weather_risk': 0.7, 'handoff_margin_hours': 0.5, 'downstream_critical': 2, 'priority_score': 1.0, 'route_reliability': 0.6}); print(f'Failure prob: {prob:.2%}, SHAP: {shap}')"
```
Expected: High failure probability (>70%) with SHAP features

### 4. Memory System
```bash
cd backend
python -c "from memory.episodes import store_episode, get_boost; store_episode({'id': 'test', 'shipment_id': 'S001', 'path': 'W1→D1', 'revival_prob': 0.9, 'cost_delta': 2.0, 'outcome': 'SUCCESS', 'score': 0.8, 'carrier': 'C1'}); boost = get_boost('C1', 'SUCCESS'); print(f'Boost: {boost}')"
```
Expected: `Boost: 1.0` (or similar value between 0.8-1.2)

### 5. Agent Graph
```bash
cd backend
python -c "from agent.graph import APP; print('Graph compiled:', APP is not None)"
```
Expected: `Graph compiled: True`

### 6. Full System Test
```bash
cd backend
python test_system.py
```
Expected: All 7 tests pass with ✓ marks

## API Tests

### Start Server
```bash
cd backend
uvicorn main:app --reload --port 8000
```

In a new terminal, run these tests:

### 1. Health Check
```bash
curl http://localhost:8000/
```
Expected: `{"message":"Phantom Fleet API","status":"running"}`

### 2. Get Initial State
```bash
curl http://localhost:8000/state
```
Expected: JSON with `tick: 0`, empty `shipments`, etc.

### 3. Run First Tick
```bash
curl -X POST http://localhost:8000/tick
```
Expected: JSON with `tick: 1`, 50 shipments, risk_map populated

### 4. Run Multiple Ticks
```bash
# Tick 2
curl -X POST http://localhost:8000/tick

# Tick 3 (carrier degradation)
curl -X POST http://localhost:8000/tick

# Tick 4 (should have at-risk shipments)
curl -X POST http://localhost:8000/tick
```

Check for:
- [ ] `active_at_risk` list has entries
- [ ] `causal_map` has Claude hypotheses
- [ ] `interventions` created
- [ ] Some interventions have `execution: "AUTO"`
- [ ] Some interventions have `execution: "PENDING_HUMAN"` (if CRITICAL)

### 5. Test Approval Flow
```bash
# Get state to find a PENDING_HUMAN intervention
curl http://localhost:8000/state | grep -o '"id":"[^"]*"' | head -1

# Approve it (replace INTERVENTION_ID)
curl -X POST http://localhost:8000/approve/INTERVENTION_ID \
  -H "Content-Type: application/json" \
  -d '{"decision": "approve"}'
```

Expected: Intervention status changes to `HUMAN_APPROVED`

### 6. Test SSE Stream
```bash
curl http://localhost:8000/stream
```
Expected: Stream of `data: {...}` events every 5 seconds

Press Ctrl+C to stop.

## Disruption Scenario Tests

Run ticks 1-10 and verify disruptions occur:

### Tick 3: Carrier Degradation
```bash
# Run 3 ticks
for i in {1..3}; do curl -X POST http://localhost:8000/tick -s > /dev/null; done

# Check state
curl http://localhost:8000/state | grep -o '"carrier_reliability":[0-9.]*' | head -5
```
Expected: Some carriers have reliability around 0.25

### Tick 5: Weather Event
```bash
# Run 2 more ticks
for i in {1..2}; do curl -X POST http://localhost:8000/tick -s > /dev/null; done

# Check state
curl http://localhost:8000/state | grep -o '"weather_risk":[0-9.]*' | head -1
```
Expected: `weather_risk` around 0.78

### Tick 7: Warehouse Congestion
```bash
# Run 2 more ticks
for i in {1..2}; do curl -X POST http://localhost:8000/tick -s > /dev/null; done

# Check state
curl http://localhost:8000/state | grep -o '"warehouse_pressure":[0-9.]*' | head -5
```
Expected: Some warehouses have pressure around 0.91

### Tick 10: Compound Event
```bash
# Run 3 more ticks
for i in {1..3}; do curl -X POST http://localhost:8000/tick -s > /dev/null; done

# Check state
curl http://localhost:8000/state | grep -o '"active_at_risk":\[[^]]*\]'
```
Expected: Multiple at-risk shipments

## Learning Verification

After running 10+ ticks:

```bash
curl http://localhost:8000/state | grep -o '"episode_count":[0-9]*'
curl http://localhost:8000/state | grep -o '"calibration_boost":{[^}]*}'
```

Expected:
- [ ] `episode_count` > 0
- [ ] `calibration_boost` has entries with values != 1.0

## Performance Benchmarks

### Single Tick Latency
```bash
time curl -X POST http://localhost:8000/tick -s > /dev/null
```
Expected: < 15 seconds total

### Breakdown (check server logs):
- Observe: < 100ms
- Risk Assess (XGBoost + SHAP): < 500ms
- Causal Reason (Claude API): 2-6 seconds
- Plan: < 100ms
- Act: < 50ms
- Learn: < 100ms

## Common Issues

### Issue: CUDA not available
**Solution:**
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### Issue: Model not found
**Solution:**
```bash
cd backend && python models/train.py
```

### Issue: Anthropic API errors
**Solution:**
- Check `.env` has valid key
- Test: `curl https://api.anthropic.com/v1/messages -H "x-api-key: YOUR_KEY"`

### Issue: Import errors
**Solution:**
- Make sure you're in `backend/` directory
- Check all `__init__.py` files exist (create empty ones if needed)

### Issue: ChromaDB errors
**Solution:**
```bash
pip install --upgrade chromadb sentence-transformers
```

## Final Validation

All checks passed? You're ready to:

1. ✅ Run the demo for judges
2. ✅ Show the complete ORDAL loop
3. ✅ Demonstrate learning over time
4. ✅ Explain guardrails and HITL
5. ✅ Walk through the agent graph

## Demo Script

1. Start server: `uvicorn main:app --reload --port 8000`
2. Open browser to API docs: `http://localhost:8000/docs`
3. Run ticks 1-10 showing disruptions
4. Point out:
   - XGBoost predictions in risk_map
   - Claude hypotheses in causal_map
   - AUTO vs PENDING_HUMAN execution
   - Episode count increasing
   - Calibration boosts changing
5. Approve a PENDING_HUMAN intervention
6. Show learning panel with boost multipliers

Good luck! 🚀
