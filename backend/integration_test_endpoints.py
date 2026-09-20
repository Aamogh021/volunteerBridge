"""Manual integration test script for VolunteerBridge API endpoints.

Run this script when the FastAPI server is running on localhost:8000:
    uvicorn main:app --reload
"""

import requests
import json

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

def run_health_check():
    res = requests.get(f"{BASE_URL}/health")
    print_result("GET /health", res)

def run_get_needs():
    res = requests.get(f"{BASE_URL}/needs/{ORG_ID}")
    print_result("GET /needs", res)
    return res.json()

def run_get_volunteers():
    res = requests.get(f"{BASE_URL}/volunteers/{ORG_ID}")
    print_result("GET /volunteers", res)
    return res.json()

def run_crisis_report():
    res = requests.get(f"{BASE_URL}/crisis-report/{ORG_ID}")
    print_result("GET /crisis-report", res)

def run_match(need_id):
    payload = {
        "need_id": need_id,
        "org_id": ORG_ID
    }
    res = requests.post(f"{BASE_URL}/match", json=payload)
    print_result("POST /match", res)
    return res.json()

def run_assign(need_id, volunteer_id):
    payload = {
        "need_id": need_id,
        "volunteer_id": volunteer_id,
        "org_id": ORG_ID
    }
    res = requests.post(f"{BASE_URL}/assign", json=payload)
    print_result("POST /assign", res)

def run_ingest():
    payload = {
        "text_content": "A tree fell on a house in Dadar, need construction skills to clear debris. Critical situation, 5 hours needed.",
        "org_id": ORG_ID
    }
    res = requests.post(f"{BASE_URL}/ingest", json=payload)
    print_result("POST /ingest", res)
    return res.json()

if __name__ == "__main__":
    run_health_check()
    needs = run_get_needs()
    vols = run_get_volunteers()
    run_crisis_report()
    
    unassigned_needs = [n for n in needs if n.get("status") == "unassigned"]
    if unassigned_needs:
        need_id = unassigned_needs[0]["id"]
        matches = run_match(need_id)
        if matches and len(matches) > 0:
            vol_id = matches[0]["volunteer"]["id"]
            run_assign(need_id, vol_id)
