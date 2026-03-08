"""
System health check script
Run this before starting the application
"""
import os
import sys
from pathlib import Path

print("=" * 70)
print("PHANTOM FLEET - SYSTEM HEALTH CHECK")
print("=" * 70)

errors = []
warnings = []

# Check 1: Python version
print("\n[1/8] Checking Python version...")
if sys.version_info >= (3, 10):
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
else:
    errors.append(f"Python 3.10+ required, found {sys.version_info.major}.{sys.version_info.minor}")
    print(f"✗ Python {sys.version_info.major}.{sys.version_info.minor} (need 3.10+)")

# Check 2: Backend folder
print("\n[2/8] Checking backend folder...")
if Path("backend").exists():
    print("✓ backend/ folder exists")
else:
    errors.append("backend/ folder not found")
    print("✗ backend/ folder not found")

# Check 3: Model file
print("\n[3/8] Checking model file...")
model_path = Path("backend/models/model.pkl")
if model_path.exists():
    size_mb = model_path.stat().st_size / (1024 * 1024)
    print(f"✓ model.pkl exists ({size_mb:.1f} MB)")
else:
    warnings.append("model.pkl not found - run: cd backend && python models/train.py")
    print("⚠ model.pkl not found (need to train)")

# Check 4: .env file
print("\n[4/8] Checking .env file...")
env_path = Path(".env")
if env_path.exists():
    print("✓ .env file exists")
    with open(env_path) as f:
        content = f.read()
        if "HUGGINGFACEHUB_API_TOKEN" in content:
            if "your_token_here" in content or "hf_" not in content:
                warnings.append("Hugging Face token not set in .env")
                print("⚠ Hugging Face token not configured (will use fallback mode)")
            else:
                print("✓ Hugging Face token configured")
        else:
            warnings.append("HUGGINGFACEHUB_API_TOKEN not in .env")
            print("⚠ HUGGINGFACEHUB_API_TOKEN not in .env")
else:
    warnings.append(".env file not found")
    print("⚠ .env file not found")

# Check 5: Backend dependencies
print("\n[5/8] Checking backend dependencies...")
try:
    import fastapi
    import uvicorn
    import langgraph
    import xgboost
    print("✓ Core dependencies installed")
except ImportError as e:
    errors.append(f"Missing dependency: {e.name}")
    print(f"✗ Missing dependency: {e.name}")
    print("  Run: pip install -r requirements.txt")

# Check 6: Frontend folder
print("\n[6/8] Checking frontend folder...")
if Path("frontend").exists():
    print("✓ frontend/ folder exists")
    if Path("frontend/node_modules").exists():
        print("✓ node_modules exists")
    else:
        warnings.append("node_modules not found - run: cd frontend && npm install")
        print("⚠ node_modules not found (need to run npm install)")
else:
    warnings.append("frontend/ folder not found")
    print("⚠ frontend/ folder not found")

# Check 7: Vite config
print("\n[7/8] Checking vite config...")
vite_config = Path("frontend/vite.config.ts")
if vite_config.exists():
    with open(vite_config) as f:
        content = f.read()
        if "localhost:8000" in content:
            print("✓ Vite proxy configured correctly (port 8000)")
        elif "localhost:8001" in content:
            errors.append("Vite proxy pointing to wrong port (8001 instead of 8000)")
            print("✗ Vite proxy pointing to port 8001 (should be 8000)")
        else:
            warnings.append("Could not verify proxy configuration")
            print("⚠ Could not verify proxy configuration")
else:
    warnings.append("vite.config.ts not found")
    print("⚠ vite.config.ts not found")

# Check 8: Port availability
print("\n[8/8] Checking port availability...")
import socket

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

if is_port_in_use(8000):
    print("⚠ Port 8000 is already in use (backend might be running)")
else:
    print("✓ Port 8000 is available")

if is_port_in_use(5173):
    print("⚠ Port 5173 is already in use (frontend might be running)")
else:
    print("✓ Port 5173 is available")

# Summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

if errors:
    print(f"\n❌ {len(errors)} ERROR(S) FOUND:")
    for i, error in enumerate(errors, 1):
        print(f"  {i}. {error}")

if warnings:
    print(f"\n⚠️  {len(warnings)} WARNING(S):")
    for i, warning in enumerate(warnings, 1):
        print(f"  {i}. {warning}")

if not errors and not warnings:
    print("\n✅ ALL CHECKS PASSED!")
    print("\nYou can now start the application:")
    print("  Terminal 1: cd backend && uvicorn main:app --reload --port 8000")
    print("  Terminal 2: cd frontend && npm run dev")
elif not errors:
    print("\n✅ NO CRITICAL ERRORS")
    print("\nYou can start the application, but address warnings for full functionality:")
    print("  Terminal 1: cd backend && uvicorn main:app --reload --port 8000")
    print("  Terminal 2: cd frontend && npm run dev")
else:
    print("\n❌ PLEASE FIX ERRORS BEFORE STARTING")
    print("\nCommon fixes:")
    print("  - Install dependencies: pip install -r requirements.txt")
    print("  - Train model: cd backend && python models/train.py")
    print("  - Install frontend: cd frontend && npm install")
    print("  - Fix vite config: Change port 8001 to 8000 in frontend/vite.config.ts")

print("\n" + "=" * 70)
