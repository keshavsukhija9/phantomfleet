# Phantom Fleet Backend Setup Instructions

## Hardware Requirements
- RTX 3050 GPU (for XGBoost and embeddings acceleration)
- i7 13th Gen CPU (for parallel processing)
- 8GB+ RAM

## Prerequisites
1. Python 3.10 or higher
2. CUDA toolkit installed (for GPU acceleration)
3. Anthropic API key

## Setup Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file in the project root:
```bash
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 3. Train the Model (One-time, ~3 minutes)
```bash
cd backend
python models/train.py
```

Expected output:
- Generates 5000 training samples
- Trains XGBoost with GPU acceleration
- AUC should be > 0.85
- Creates `models/model.pkl`

### 4. Test the System
```bash
cd backend
python test_system.py
```

This runs 7 tests to verify:
- All imports work
- Simulation generates data
- XGBoost model predicts correctly
- Memory system stores/retrieves
- Agent state initializes
- LangGraph compiles
- Full agent cycle runs

### 5. Start the Backend Server
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Server will be available at: `http://localhost:8000`

### 6. Test API Endpoints

**Get current state:**
```bash
curl http://localhost:8000/state
```

**Run one tick:**
```bash
curl -X POST http://localhost:8000/tick
```

**Approve an intervention:**
```bash
curl -X POST http://localhost:8000/approve/INTERVENTION_ID \
  -H "Content-Type: application/json" \
  -d '{"decision": "approve"}'
```

**Stream mode (SSE):**
```bash
curl http://localhost:8000/stream
```

## GPU Optimization Notes

### XGBoost (RTX 3050)
The model is configured with:
- `tree_method="hist"` - GPU-accelerated histogram method
- `device="cuda"` - Uses RTX 3050
- Training: ~30 seconds for 5000 samples
- Inference: <5ms per shipment

### SHAP Explainer (RTX 3050)
- Uses `GPUTreeExplainer` when available
- Falls back to CPU if GPU unavailable
- Generates top-3 features in <10ms

### Embeddings (RTX 3050)
- `sentence-transformers` with `all-MiniLM-L6-v2`
- Runs on CUDA device
- Single-digit millisecond embeddings

### Multiprocessing (i7 13th Gen)
- Uses 75% of CPU cores for parallel tasks
- Bypasses Python GIL with `multiprocessing.Pool`
- Ideal for future Monte Carlo simulations

## Architecture Overview

```
backend/
├── main.py                 # FastAPI server with REST + SSE
├── agent/
│   ├── state.py           # AgentState, Shipment, Intervention
│   ├── graph.py           # LangGraph 6-node pipeline
│   └── nodes/
│       ├── observe.py     # Ingest telemetry
│       ├── risk_assess.py # XGBoost + SHAP
│       ├── causal_reason.py # Claude API
│       ├── capacity.py    # Capacity pool
│       ├── plan.py        # Score interventions
│       ├── act.py         # Guardrails + execution
│       └── learn.py       # ChromaDB storage
├── models/
│   ├── train.py           # XGBoost training script
│   ├── predict.py         # Inference + SHAP
│   └── model.pkl          # Pre-trained model
├── simulation/
│   └── generator.py       # Synthetic data engine
└── memory/
    └── episodes.py        # ChromaDB + embeddings
```

## Agent Flow

```
observe → risk_assess → [if at-risk] → causal_reason → plan → act → learn → END
```

## Troubleshooting

### CUDA not available
If you see "Using CPU SHAP explainer":
- Verify CUDA toolkit is installed
- Check: `python -c "import torch; print(torch.cuda.is_available())"`
- Install PyTorch with CUDA: `pip install torch --index-url https://download.pytorch.org/whl/cu118`

### Model not found
Run training first: `python models/train.py`

### Anthropic API errors
- Check `.env` file has valid `ANTHROPIC_API_KEY`
- Verify API key at: https://console.anthropic.com/

### Import errors
Make sure you're in the `backend/` directory when running scripts.

## Performance Targets

With RTX 3050 + i7 13th Gen:
- Full tick cycle: <15 seconds
- XGBoost inference (50 ships): <250ms
- SHAP explanations (50 ships): <500ms
- Claude API call: 2-6 seconds (network dependent)
- Memory retrieval: <50ms

## Next Steps

After backend is running:
1. Build React frontend (see frontend/ directory)
2. Configure Vite proxy to backend
3. Run full system demo
4. Test disruption scenarios (ticks 3, 5, 7, 10)
