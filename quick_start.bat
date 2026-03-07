@echo off
echo ==========================================
echo PHANTOM FLEET - QUICK START
echo ==========================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Creating .env template...
    echo ANTHROPIC_API_KEY=your_key_here > .env
    echo ERROR: Please edit .env and add your Anthropic API key
    exit /b 1
)

REM Check if API key is set
findstr /C:"your_key_here" .env >nul
if %errorlevel% equ 0 (
    echo ERROR: Please set your ANTHROPIC_API_KEY in .env file
    exit /b 1
)

echo Environment configured
echo.

REM Install dependencies
echo [1/4] Installing Python dependencies...
cd backend
pip install -q -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)
echo Dependencies installed
echo.

REM Train model if not exists
if not exist models\model.pkl (
    echo [2/4] Training XGBoost model (first time only, ~3 minutes^)...
    python models\train.py
    if %errorlevel% neq 0 (
        echo ERROR: Model training failed
        exit /b 1
    )
) else (
    echo [2/4] Model already trained
)
echo.

REM Run tests
echo [3/4] Running system tests...
python test_system.py
if %errorlevel% neq 0 (
    echo ERROR: System tests failed
    exit /b 1
)
echo.

REM Start server
echo [4/4] Starting FastAPI server...
echo.
echo ==========================================
echo Server starting at http://localhost:8000
echo ==========================================
echo.
echo API Endpoints:
echo   GET  /state          - Get current state
echo   POST /tick           - Run one tick
echo   POST /approve/{id}   - Approve intervention
echo   GET  /stream         - SSE stream (auto-run^)
echo.
echo Press Ctrl+C to stop
echo.

uvicorn main:app --reload --port 8000
