@echo off
echo ==========================================
echo PHANTOM FLEET - QUICK START
echo ==========================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Creating .env template...
    echo HUGGINGFACEHUB_API_TOKEN=your_hf_token_here > .env
    echo ERROR: Please edit .env and add your Hugging Face API token
    exit /b 1
)

echo Environment configured
echo.

REM Install Python dependencies
echo [1/5] Installing Python dependencies...
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
    echo [2/5] Training XGBoost model (first time only, ~3 minutes^)...
    python models\train.py
    if %errorlevel% neq 0 (
        echo ERROR: Model training failed
        exit /b 1
    )
) else (
    echo [2/5] Model already trained
)
echo.

REM Run tests
echo [3/5] Running system tests...
python test_system.py
if %errorlevel% neq 0 (
    echo ERROR: System tests failed
    exit /b 1
)
echo.

REM Install frontend dependencies
echo [4/5] Installing frontend dependencies...
cd ..\frontend
if not exist node_modules (
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)
echo.

REM Start both servers
echo [5/5] Starting servers...
echo.
echo ==========================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ==========================================
echo.
echo Open http://localhost:5173 in your browser
echo Press Ctrl+C to stop
echo.

REM Start frontend dev server in background
start "Phantom Fleet Frontend" cmd /c "npm run dev"

REM Start backend server (foreground)
cd ..\backend
uvicorn main:app --reload --port 8000
