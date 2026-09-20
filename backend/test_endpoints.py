"""Integration testing script for VolunteerBridge API endpoints.

This script tests live HTTP endpoints on http://localhost:8000.
"""

import requests
import json
import pytest

BASE_URL = "http://localhost:8000"
ORG_ID = "default"

def print_result(name, res):
    print(f"--- {name} ---")
    print(f"Status: {res.status_code}")
    try:
        print(json.dumps(res.json(), indent=2))
    except Exception:
        print(res.text)
    print("\n")

def run_test_health():
    res = requests.get(f"{BASE_URL}/health")
    print_result("GET /health", res)
    return res

def run_test_get_needs():
    res = requests.get(f"{BASE_URL}/needs/{ORG_ID}")
    print_result("GET /needs", res)
    return res.json()

def run_test_get_volunteers():
    res = requests.get(f"{BASE_URL}/volunteers/{ORG_ID}")
    print_result("GET /volunteers", res)
    return res.json()

def run_test_crisis_report():
    res = requests.get(f"{BASE_URL}/crisis-report/{ORG_ID}")
    print_result("GET /crisis-report", res)
    return res.json()

def run_test_match(need_id):
    payload = {
        "need_id": need_id,
        "org_id": ORG_ID
    }
    res = requests.post(f"{BASE_URL}/match", json=payload)
    print_result("POST /match", res)
    return res.json()

def run_test_assign(need_id, volunteer_id):
    payload = {
        "need_id": need_id,
        "volunteer_id": volunteer_id,
        "org_id": ORG_ID
    }
    res = requests.post(f"{BASE_URL}/assign", json=payload)
    print_result("POST /assign", res)
    return res.json()

def run_test_ingest():
    payload = {
        "text_content": "A tree fell on a house in Dadar, need construction skills to clear debris. Critical situation, 5 hours needed.",
        "org_id": ORG_ID
    }
    res = requests.post(f"{BASE_URL}/ingest", json=payload)
    print_result("POST /ingest", res)
    return res.json()

# Pytest integration wrappers (only execute when server is live)
@pytest.mark.skip(reason="Live server integration test script; run via `python test_endpoints.py` when server is running.")
def test_live_server_health():
    res = run_test_health()
    assert res.status_code == 200

if __name__ == "__main__":
    run_test_health()
    needs = run_test_get_needs()
    vols = run_test_get_volunteers()
    run_test_crisis_report()
    
    unassigned_needs = [n for n in needs if n.get("status") == "unassigned"]
    if unassigned_needs:
        need_id = unassigned_needs[0]["id"]
        matches = run_test_match(need_id)
        if matches and len(matches) > 0:
            vol_id = matches[0]["volunteer"]["id"]
            run_test_assign(need_id, vol_id)
