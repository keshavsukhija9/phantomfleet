"""
Quick test script to verify backend is working
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("BACKEND API TEST")
print("=" * 60)

# Test 1: Root endpoint
print("\n[1/3] Testing root endpoint...")
try:
    response = requests.get(f"{BASE_URL}/")
    print(f"✓ Status: {response.status_code}")
    print(f"✓ Response: {response.json()}")
except Exception as e:
    print(f"✗ Error: {e}")
    print("Make sure backend is running: cd backend && uvicorn main:app --reload --port 8000")
    exit(1)

# Test 2: Get state
print("\n[2/3] Testing /state endpoint...")
try:
    response = requests.get(f"{BASE_URL}/state")
    print(f"✓ Status: {response.status_code}")
    data = response.json()
    print(f"✓ Tick: {data.get('tick', 0)}")
    print(f"✓ Shipments: {len(data.get('shipments', {}))}")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test 3: Run tick
print("\n[3/3] Testing /tick endpoint...")
try:
    response = requests.post(f"{BASE_URL}/tick")
    print(f"✓ Status: {response.status_code}")
    data = response.json()
    print(f"✓ Tick: {data.get('tick', 0)}")
    print(f"✓ Shipments: {len(data.get('shipments', {}))}")
    print(f"✓ At Risk: {len(data.get('active_at_risk', []))}")
    print(f"✓ Interventions: {len(data.get('interventions', {}))}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("\n" + "=" * 60)
print("ALL TESTS PASSED ✓")
print("=" * 60)
print("\nBackend is working correctly!")
print("You can now start the frontend: cd frontend && npm run dev")
