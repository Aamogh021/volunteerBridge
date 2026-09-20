import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

ORG_ID = "default"

volunteers = [
    {
        "name": "Priya Sharma",
        "skills": ["medical", "first aid", "nursing"],
        "skill_description": "Certified ICU nurse with 5 years experience and advanced first aid certification",
        "location": {"lat": 19.0176, "lng": 72.8562, "zone": "Dharavi"},
        "availability": True,
        "completion_rate": 0.96,
        "avg_response_minutes": 3.0,
        "tasks_completed": 23,
        "fcm_token": "demo_token_priya"
    },
    {
        "name": "Rahul Verma",
        "skills": ["construction", "heavy lifting", "logistics"],
        "skill_description": "Civil engineer with debris clearing and structural damage assessment experience",
        "location": {"lat": 19.0383, "lng": 72.8527, "zone": "Sion"},
        "availability": True,
        "completion_rate": 0.89,
        "avg_response_minutes": 7.0,
        "tasks_completed": 17,
        "fcm_token": "demo_token_rahul"
    },
    {
        "name": "Ananya Iyer",
        "skills": ["counseling", "mental health", "teaching", "translation"],
        "skill_description": "Trauma psychologist with child education support and Hindi/Tamil translation skills",
        "location": {"lat": 19.0222, "lng": 72.8397, "zone": "Matunga"},
        "availability": True,
        "completion_rate": 0.94,
        "avg_response_minutes": 5.0,
        "tasks_completed": 31,
        "fcm_token": "demo_token_ananya"
    },
    {
        "name": "Vikram Nair",
        "skills": ["driving", "logistics", "food distribution"],
        "skill_description": "Heavy vehicle licensed driver with food supply chain and distribution management experience",
        "location": {"lat": 19.0154, "lng": 72.8619, "zone": "Wadala"},
        "availability": True,
        "completion_rate": 0.91,
        "avg_response_minutes": 6.0,
        "tasks_completed": 28,
        "fcm_token": "demo_token_vikram"
    },
    {
        "name": "Meera Pillai",
        "skills": ["medical", "pharmacy", "first aid"],
        "skill_description": "Pharmacist with emergency first aid and critical medication management expertise",
        "location": {"lat": 19.0596, "lng": 72.9001, "zone": "Chembur"},
        "availability": True,
        "completion_rate": 0.98,
        "avg_response_minutes": 4.0,
        "tasks_completed": 42,
        "fcm_token": "demo_token_meera"
    },
    {
        "name": "Arjun Desai",
        "skills": ["construction", "electrical", "logistics"],
        "skill_description": "Electrician and construction worker experienced in emergency infrastructure repair",
        "location": {"lat": 19.0728, "lng": 72.8826, "zone": "Kurla"},
        "availability": True,
        "completion_rate": 0.87,
        "avg_response_minutes": 9.0,
        "tasks_completed": 14,
        "fcm_token": "demo_token_arjun"
    },
    {
        "name": "Sneha Kulkarni",
        "skills": ["food distribution", "cooking", "counseling"],
        "skill_description": "Community kitchen coordinator with large-scale meal preparation and emotional support experience",
        "location": {"lat": 19.0089, "lng": 72.8370, "zone": "Parel"},
        "availability": True,
        "completion_rate": 0.93,
        "avg_response_minutes": 8.0,
        "tasks_completed": 36,
        "fcm_token": "demo_token_sneha"
    },
    {
        "name": "Mohammed Shaikh",
        "skills": ["driving", "medical", "first aid"],
        "skill_description": "Ambulance driver with paramedic training and emergency response coordination experience",
        "location": {"lat": 19.0330, "lng": 72.8697, "zone": "Byculla"},
        "availability": False,
        "completion_rate": 0.97,
        "avg_response_minutes": 2.0,
        "tasks_completed": 58,
        "fcm_token": "demo_token_mohammed"
    },
]

needs = [
    {
        "need_type": "Medical Aid",
        "urgency_score": 9,
        "required_skills": ["medical", "first aid"],
        "location": {"lat": 19.0200, "lng": 72.8500, "zone": "Dharavi"},
        "volunteer_hours_needed": 4.0,
        "confidence_score": 0.95,
        "status": "completed",
        "org_id": ORG_ID,
        "created_at": datetime.now()
    },
    {
        "need_type": "Food Distribution",
        "urgency_score": 7,
        "required_skills": ["food distribution", "logistics"],
        "location": {"lat": 19.0350, "lng": 72.8550, "zone": "Sion"},
        "volunteer_hours_needed": 3.0,
        "confidence_score": 0.88,
        "status": "completed",
        "org_id": ORG_ID,
        "created_at": datetime.now()
    },
    {
        "need_type": "Debris Clearing",
        "urgency_score": 8,
        "required_skills": ["construction", "heavy lifting"],
        "location": {"lat": 19.0600, "lng": 72.8900, "zone": "Chembur"},
        "volunteer_hours_needed": 6.0,
        "confidence_score": 0.91,
        "status": "assigned",
        "org_id": ORG_ID,
        "created_at": datetime.now()
    },
]

print("🌱 Seeding Firestore...")

for v in volunteers:
    ref = db.collection("organizations").document(ORG_ID).collection("volunteers").document()
    ref.set(v)
    print(f"✅ Added volunteer: {v['name']}")

for n in needs:
    ref = db.collection("organizations").document(ORG_ID).collection("needs").document()
    ref.set(n)
    print(f"✅ Added need: {n['need_type']}")

print("\n🎉 Seeding complete!")
print(f"   {len(volunteers)} volunteers added")
print(f"   {len(needs)} historical needs added")
print("\nYour Firestore is ready for demo.")