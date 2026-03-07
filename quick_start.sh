#!/bin/bash

echo "=========================================="
echo "PHANTOM FLEET - QUICK START"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env template..."
    echo "ANTHROPIC_API_KEY=your_key_here" > .env
    echo "❌ Please edit .env and add your Anthropic API key"
    exit 1
fi

# Check if API key is set
if grep -q "your_key_here" .env; then
    echo "❌ Please set your ANTHROPIC_API_KEY in .env file"
    exit 1
fi

echo "✓ Environment configured"
echo ""

# Install dependencies
echo "[1/4] Installing Python dependencies..."
cd backend
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

# Train model if not exists
if [ ! -f models/model.pkl ]; then
    echo "[2/4] Training XGBoost model (first time only, ~3 minutes)..."
    python models/train.py
    if [ $? -ne 0 ]; then
        echo "❌ Model training failed"
        exit 1
    fi
else
    echo "[2/4] Model already trained ✓"
fi
echo ""

# Run tests
echo "[3/4] Running system tests..."
python test_system.py
if [ $? -ne 0 ]; then
    echo "❌ System tests failed"
    exit 1
fi
echo ""

# Start server
echo "[4/4] Starting FastAPI server..."
echo ""
echo "=========================================="
echo "Server starting at http://localhost:8000"
echo "=========================================="
echo ""
echo "API Endpoints:"
echo "  GET  /state          - Get current state"
echo "  POST /tick           - Run one tick"
echo "  POST /approve/{id}   - Approve intervention"
echo "  GET  /stream         - SSE stream (auto-run)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn main:app --reload --port 8000
