#!/bin/bash
echo "=========================================="
echo "PHANTOM FLEET - QUICK START"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found!"
    echo "Creating .env template..."
    echo "HUGGINGFACEHUB_API_TOKEN=your_hf_token_here" > .env
    echo "ERROR: Please edit .env and add your Hugging Face API token"
    exit 1
fi

echo "Environment configured"
echo ""

# Install Python dependencies
echo "[1/5] Installing Python dependencies..."
cd backend
pip install -q -r requirements.txt || { echo "ERROR: Failed to install dependencies"; exit 1; }
echo "Dependencies installed"
echo ""

# Train model if not exists
if [ ! -f models/model.pkl ]; then
    echo "[2/5] Training XGBoost model (first time only, ~3 minutes)..."
    python models/train.py || { echo "ERROR: Model training failed"; exit 1; }
else
    echo "[2/5] Model already trained"
fi
echo ""

# Run tests
echo "[3/5] Running system tests..."
python test_system.py || { echo "ERROR: System tests failed"; exit 1; }
echo ""

# Install frontend dependencies
echo "[4/5] Installing frontend dependencies..."
cd ../frontend
if [ ! -d node_modules ]; then
    npm install || { echo "ERROR: Failed to install frontend dependencies"; exit 1; }
else
    echo "Frontend dependencies already installed"
fi
echo ""

# Start both servers
echo "[5/5] Starting servers..."
echo ""
echo "=========================================="
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "=========================================="
echo ""
echo "Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop"
echo ""

# Start frontend dev server in background
npm run dev &
FRONTEND_PID=$!

# Start backend server (foreground)
cd ../backend
uvicorn main:app --reload --port 8000

# Cleanup frontend when backend exits
kill $FRONTEND_PID 2>/dev/null
