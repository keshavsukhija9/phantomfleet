# 🚀 Phantom Fleet - Quick Start Guide

Complete setup in 5 minutes!

## Prerequisites

- Python 3.10+
- CUDA toolkit (optional, for GPU acceleration)
- Hugging Face API token (free)

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Set API Key

Get your free Hugging Face token at https://huggingface.co/settings/tokens

Edit `.env` file:
```bash
HUGGINGFACEHUB_API_TOKEN=hf_your_token_here
```

## Step 3: Train the Model

```bash
cd backend
python models/train.py
cd ..
```

Expected output:
```
Generating training data...
Training XGBoost model with GPU acceleration...
Using device: cuda
AUC: 0.XXX
Model saved to backend/models/model.pkl
```

## Step 4: Test the System

```bash
cd backend
python test_system.py
cd ..
```

All 7 tests should pass ✓

## Step 5: Run the App (PRD-compliant Streamlit version)

```bash
streamlit run app_streamlit.py
```

Browser will open automatically at `http://localhost:8501`

**Alternative:** For the React + FastAPI version:

Terminal 1:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Terminal 2:
```bash
streamlit run app.py
```

## 🎮 Using the Demo

### Manual Mode
1. Click "▶️ Run Next Tick" to advance simulation
2. Watch the map update with at-risk shipments
3. See Claude's causal reasoning in the Agent Reasoning panel
4. Approve/reject CRITICAL shipments in escalation cards

### Auto Mode
1. Toggle "🔄 Auto-Run (every 5s)"
2. System runs automatically
3. Watch the learning progress over time

## 📊 Demo Sequence

**Tick 1-2:** Normal operations
- 50 shipments generated
- Low risk levels
- No interventions

**Tick 3:** Carrier C4 Degradation 🚨
- Carrier reliability drops to 0.25
- Multiple shipments flagged AT_RISK
- Claude generates causal hypotheses
- AUTO interventions executed

**Tick 5:** Weather Event 🌧️
- Weather risk spikes to 0.78
- Different causal reasoning
- More interventions

**Tick 7:** Warehouse W3 Congestion 📦
- Warehouse pressure → 0.91
- CRITICAL shipments require human approval
- Escalation cards appear

**Tick 10:** Compound Event ⚠️
- Multiple simultaneous disruptions
- Learning system adjusts scoring
- Calibration boosts visible in Learning Progress

**Tick 12+:** Recovery & Learning
- Gradual recovery begins
- Episode count increases
- Score multipliers change based on past success/failure

## 🎯 What to Show Judges

### 1. Complete ORDAL Loop
Point to each stage:
- **Observe:** Tick counter, 50 shipments
- **Reason:** XGBoost risk scores + Claude hypotheses
- **Decide:** Intervention planning with capacity scoring
- **Act:** AUTO execution + guardrails + HITL
- **Learn:** Episode count + calibration boost chart

### 2. AI Reasoning (Not Rule-Based)
- Show XGBoost predictions in Risk Feed
- Show SHAP feature importance
- Show Claude's causal hypothesis (live API call)
- Open `backend/agent/nodes/causal_reason.py` to show prompt

### 3. Learning Loop
- Open Learning Progress panel
- Show calibration boost changing over ticks
- Explain: "Carriers with past failures score lower, reliable carriers score higher"
- Show episode count incrementing

### 4. Human Oversight
- Wait for CRITICAL shipment
- Show escalation card with all details
- Explain 4 guardrails (score, cost, priority, viability)
- Approve/reject and show status change

### 5. LangGraph Architecture
- Open `backend/agent/graph.py`
- Walk through 6-node topology
- Show conditional routing
- Explain interrupt_before for HITL

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process if needed
taskkill /PID <PID> /F
```

### Model not found
```bash
cd backend
python models/train.py
```

### Claude API errors
Check `.env` has valid `ANTHROPIC_API_KEY`

### Frontend can't connect
Make sure backend is running on port 8000

### CUDA not available
System will use CPU automatically (slower but works)

## 📈 Performance Expectations

With RTX 3050 + i7 13th Gen:
- Full tick cycle: 8-15 seconds
- XGBoost (50 ships): ~150ms
- SHAP explanations: ~300ms
- Claude API: 2-6 seconds (network)
- Memory retrieval: ~20ms

## 🎓 Judge Q&A Prep

**"Is this rule-based?"**
> No. Risk predictions come from trained XGBoost with SHAP. Causal reasoning is live Claude API calls reading actual feature values.

**"Where is the learning?"**
> Every intervention is stored in ChromaDB. The calibration boost chart shows memory affecting scoring. Reliable carriers score higher.

**"What about human oversight?"**
> CRITICAL shipments never auto-execute. They always generate escalation cards. The agent explains why and waits for human decision.

**"Show me the ORDAL loop"**
> [Walk through graph.py] Observe ingests tick → Risk Assess runs XGBoost → Causal Reason calls Claude → Plan scores paths → Act checks guardrails → Learn stores episodes.

## 📁 Project Structure

```
phantom_fleet/
├── app.py                      # Streamlit frontend (YOU ARE HERE)
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── agent/
│   │   ├── graph.py           # LangGraph 6-node pipeline
│   │   ├── state.py           # Data models
│   │   └── nodes/             # 6 agent nodes
│   ├── models/
│   │   ├── train.py           # XGBoost training
│   │   ├── predict.py         # Inference + SHAP
│   │   └── model.pkl          # Trained model
│   ├── simulation/
│   │   └── generator.py       # Synthetic data
│   └── memory/
│       └── episodes.py        # ChromaDB storage
├── .env                       # API keys
└── README.md                  # Documentation
```

## 🎉 Success Criteria

✅ Backend running on port 8000
✅ Frontend running on port 8501
✅ Model trained (AUC > 0.85)
✅ All 7 tests passing
✅ Ticks 1-10 run without crashes
✅ Claude API calls working
✅ AUTO interventions visible
✅ CRITICAL escalations appear
✅ Episode count incrementing
✅ Calibration boosts changing

## 🚀 You're Ready!

The complete ORDAL loop is now running. Show the judges:
1. Live XGBoost predictions
2. Claude causal reasoning
3. Automatic interventions
4. Human-in-the-loop for CRITICAL
5. Learning from past episodes

Good luck with the hackathon! 🏆
