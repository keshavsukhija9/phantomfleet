# Phantom Fleet v3 - Agentic AI for Logistics

NMIMS Hackathon | 4-Hour Build Challenge

## Overview

Phantom Fleet is an autonomous logistics intelligence system that implements a complete **Observe → Reason → Decide → Act → Learn (ORDAL)** agentic loop. The system:

1. **Observes** - Ingests simulated shipment telemetry every tick
2. **Reasons** - Uses XGBoost + SHAP for risk prediction, Claude AI for causal analysis
3. **Decides** - Plans optimal reroute interventions with memory-based scoring
4. **Acts** - Executes interventions with 4-layer guardrails or escalates to humans
5. **Learns** - Stores outcomes in vector memory to improve future decisions

## Architecture

### Backend (Python + FastAPI)
- **LangGraph Agent**: 6-node state machine
- **ML Model**: XGBoost with GPU acceleration (RTX 3050)
- **AI Reasoning**: Anthropic Claude API
- **Memory**: ChromaDB with sentence-transformers embeddings
- **Simulation**: Synthetic disruption engine with scheduled events

### Hardware Optimization
- **RTX 3050**: XGBoost training/inference, SHAP explanations, embeddings
- **i7 13th Gen**: Parallel processing, async operations, graph planning

## Quick Start

### Prerequisites
- Python 3.10+
- CUDA toolkit (for GPU acceleration)
- Anthropic API key

### Installation

**Windows:**
```bash
quick_start.bat
```

**Linux/Mac:**
```bash
chmod +x quick_start.sh
./quick_start.sh
```

**Manual:**
```bash
# 1. Set up environment
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Train model (one-time, ~3 minutes)
python models/train.py

# 4. Test system
python test_system.py

# 5. Start server
uvicorn main:app --reload --port 8000
```

## API Endpoints

### GET /state
Get current agent state without advancing tick.

```bash
curl http://localhost:8000/state
```

### POST /tick
Run one complete agent cycle (observe → reason → decide → act → learn).

```bash
curl -X POST http://localhost:8000/tick
```

### POST /approve/{intervention_id}
Human approval/rejection of escalated interventions.

```bash
curl -X POST http://localhost:8000/approve/abc123 \
  -H "Content-Type: application/json" \
  -d '{"decision": "approve"}'
```

### GET /stream
Server-Sent Events stream for auto-run mode (tick every 5 seconds).

```bash
curl http://localhost:8000/stream
```

## Agent Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  OBSERVE    │────►│ RISK_ASSESS │────►│  CAUSAL_REASON  │
│             │     │  (XGBoost)  │     │    (Claude)     │
└─────────────┘     └─────────────┘     └────────┬────────┘
                           │                      │
                    no at-risk                    ▼
                           │             ┌─────────────────┐
                           ▼             │      PLAN       │
                          END            │  (score paths)  │
                                         └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │      ACT        │
                                         │  (guardrails)   │
                                         └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │      LEARN      │
                                         │   (ChromaDB)    │
                                         └────────┬────────┘
                                                  │
                                                  ▼
                                                 END
```

## Disruption Schedule

The simulation engine has pre-programmed disruptions for demo reliability:

- **Tick 3**: Carrier C4 degradation (reliability drops to 0.25)
- **Tick 5**: Weather event (risk increases to 0.78)
- **Tick 7**: Warehouse W3 congestion (pressure spikes to 0.91)
- **Tick 10**: Compound event (C6 breakdown + customs delay)
- **Tick 12+**: Gradual recovery

## Guardrails

All 4 conditions must pass for AUTO execution:

1. **Confidence**: intervention.score >= 0.70
2. **Cost Control**: cost_delta_pct <= 5.0%
3. **Priority Gate**: priority != CRITICAL
4. **Viability**: revival_prob >= 0.65

If any fail → escalates to human approval (PENDING_HUMAN)

## Learning Mechanism

The system learns from past interventions:

1. Every resolved intervention is stored in ChromaDB
2. `get_boost()` queries past episodes by carrier
3. Success rate → calibration multiplier (0.8-1.2)
4. Future interventions with that carrier are scored higher/lower
5. Visible in `calibration_boost` map

## Performance Targets

With RTX 3050 + i7 13th Gen:

- Full tick cycle: **<15 seconds**
- XGBoost inference (50 ships): **<250ms**
- SHAP explanations: **<500ms**
- Claude API call: **2-6 seconds** (network dependent)
- Memory retrieval: **<50ms**

## Project Structure

```
phantom_fleet/
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── agent/
│   │   ├── state.py           # Data models
│   │   ├── graph.py           # LangGraph definition
│   │   └── nodes/             # 6 agent nodes
│   ├── models/
│   │   ├── train.py           # XGBoost training
│   │   ├── predict.py         # Inference + SHAP
│   │   └── model.pkl          # Pre-trained model
│   ├── simulation/
│   │   └── generator.py       # Synthetic data
│   └── memory/
│       └── episodes.py        # ChromaDB storage
├── .env                       # API keys
├── TODO.md                    # Build checklist
├── SETUP_INSTRUCTIONS.md      # Detailed setup
└── README.md                  # This file
```

## Demo Checklist

Before presenting to judges:

- [ ] `python models/train.py` → AUC > 0.85
- [ ] `python test_system.py` → all tests pass
- [ ] `uvicorn main:app` → server starts without errors
- [ ] Tick 1-10 run without crashes
- [ ] Claude API calls work (check causal_map)
- [ ] At least 1 AUTO execution visible
- [ ] At least 1 PENDING_HUMAN escalation for CRITICAL
- [ ] Episode count increments
- [ ] Calibration boosts change over time

## Judge Q&A Prep

**"Is this rule-based?"**
> No. Risk predictions come from a trained XGBoost model with SHAP explanations. Causal reasoning is a live Claude API call that reads actual feature values and explains the root cause chain.

**"Where is the learning?"**
> Every executed intervention is stored in ChromaDB. The calibration_boost map shows how memory affects scoring. Paths through historically reliable carriers score higher; failed carriers score lower.

**"What about human oversight?"**
> CRITICAL priority shipments never auto-execute. They always generate an escalation requiring human approval. The agent explains why it's asking and waits for a decision.

**"What would you add with more time?"**
> A* path planner, 22-feature model, Monte Carlo simulation for path validation, Bayesian calibration, and a re-plan loop for failed interventions. The architecture is fully designed.

## Hardware Notes

### GPU Acceleration (RTX 3050)
- XGBoost: `tree_method="hist"`, `device="cuda"`
- SHAP: `GPUTreeExplainer` when available
- Embeddings: `SentenceTransformer` on CUDA

### CPU Optimization (i7 13th Gen)
- Multiprocessing for parallel tasks
- Bypasses Python GIL
- Uses 75% of cores for Monte Carlo (future)

## Troubleshooting

**CUDA not available:**
```bash
python -c "import torch; print(torch.cuda.is_available())"
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

**Model not found:**
```bash
cd backend && python models/train.py
```

**API key errors:**
Check `.env` file has valid `ANTHROPIC_API_KEY`

## License

MIT License - Built for NMIMS Hackathon

## Team

Team Lead: Keshav
