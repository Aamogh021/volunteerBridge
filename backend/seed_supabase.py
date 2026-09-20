"""Seed script for populating Supabase PostgreSQL with initial VolunteerBridge data."""

import logging
import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.supabase import get_supabase_client, resolve_org_id

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ORG_SLUG = "default"

volunteers_data = [
    {
        "name": "Priya Sharma",
        "skills": ["medical", "first aid", "nursing"],
        "skill_description": "Certified ICU nurse with 5 years experience and advanced first aid certification",
        "latitude": 19.0176,
        "longitude": 72.8562,
        "zone": "Dharavi",
        "availability": True,
        "completion_rate": 0.96,
        "avg_response_minutes": 3.0,
        "tasks_completed": 23,
    },
    {
        "name": "Rahul Verma",
        "skills": ["construction", "heavy lifting", "logistics"],
        "skill_description": "Civil engineer with debris clearing and structural damage assessment experience",
        "latitude": 19.0383,
        "longitude": 72.8527,
        "zone": "Sion",
        "availability": True,
        "completion_rate": 0.89,
        "avg_response_minutes": 7.0,
        "tasks_completed": 17,
    },
    {
        "name": "Ananya Iyer",
        "skills": ["counseling", "mental health", "teaching", "translation"],
        "skill_description": "Trauma psychologist with child education support and Hindi/Tamil translation skills",
        "latitude": 19.0222,
        "longitude": 72.8397,
        "zone": "Matunga",
        "availability": True,
        "completion_rate": 0.94,
        "avg_response_minutes": 5.0,
        "tasks_completed": 31,
    },
    {
        "name": "Vikram Nair",
        "skills": ["driving", "logistics", "food distribution"],
        "skill_description": "Heavy vehicle licensed driver with food supply chain and distribution management experience",
        "latitude": 19.0154,
        "longitude": 72.8619,
        "zone": "Wadala",
        "availability": True,
        "completion_rate": 0.91,
        "avg_response_minutes": 6.0,
        "tasks_completed": 28,
    },
    {
        "name": "Meera Pillai",
        "skills": ["medical", "pharmacy", "first aid"],
        "skill_description": "Pharmacist with emergency first aid and critical medication management expertise",
        "latitude": 19.0596,
        "longitude": 72.9001,
        "zone": "Chembur",
        "availability": True,
        "completion_rate": 0.98,
        "avg_response_minutes": 4.0,
        "tasks_completed": 42,
    },
    {
        "name": "Arjun Desai",
        "skills": ["construction", "electrical", "logistics"],
        "skill_description": "Electrician and construction worker experienced in emergency infrastructure repair",
        "latitude": 19.0728,
        "longitude": 72.8826,
        "zone": "Kurla",
        "availability": True,
        "completion_rate": 0.87,
        "avg_response_minutes": 9.0,
        "tasks_completed": 14,
    },
    {
        "name": "Sneha Kulkarni",
        "skills": ["food distribution", "cooking", "counseling"],
        "skill_description": "Community kitchen coordinator with large-scale meal preparation and emotional support experience",
        "latitude": 19.0089,
        "longitude": 72.8370,
        "zone": "Parel",
        "availability": True,
        "completion_rate": 0.93,
        "avg_response_minutes": 8.0,
        "tasks_completed": 36,
    },
    {
        "name": "Mohammed Shaikh",
        "skills": ["driving", "medical", "first aid"],
        "skill_description": "Ambulance driver with paramedic training and emergency response coordination experience",
        "latitude": 19.0330,
        "longitude": 72.8697,
        "zone": "Byculla",
        "availability": False,
        "completion_rate": 0.97,
        "avg_response_minutes": 2.0,
        "tasks_completed": 58,
    },
]

needs_data = [
    {
        "need_type": "Medical Aid",
        "urgency_score": 9,
        "required_skills": ["medical", "first aid"],
        "latitude": 19.0200,
        "longitude": 72.8500,
        "zone": "Dharavi",
        "volunteer_hours_needed": 4.0,
        "confidence_score": 0.95,
        "status": "unassigned",
        "raw_text": "Urgent medical assistance needed at Dharavi community clinic for injured flood victims.",
    },
    {
        "need_type": "Food Distribution",
        "urgency_score": 7,
        "required_skills": ["food distribution", "logistics"],
        "latitude": 19.0350,
        "longitude": 72.8550,
        "zone": "Sion",
        "volunteer_hours_needed": 3.0,
        "confidence_score": 0.88,
        "status": "unassigned",
        "raw_text": "Emergency ration kit distribution needed at Sion shelter home.",
    },
    {
        "need_type": "Debris Clearing",
        "urgency_score": 8,
        "required_skills": ["construction", "heavy lifting"],
        "latitude": 19.0600,
        "longitude": 72.8900,
        "zone": "Chembur",
        "volunteer_hours_needed": 6.0,
        "confidence_score": 0.91,
        "status": "unassigned",
        "raw_text": "Fallen tree blocking emergency access road in Chembur East.",
    },
]


def seed_supabase() -> None:
    """Seed Supabase PostgreSQL database with initial organization, volunteers, and needs."""
    logger.info("🌱 Resolving default organization...")
    org_uuid = resolve_org_id(ORG_SLUG)
    logger.info(f"✅ Organization UUID resolved: {org_uuid}")

    client = get_supabase_client()

    # Seed volunteers
    logger.info("🌱 Seeding volunteers...")
    for v in volunteers_data:
        v["organization_id"] = org_uuid
        # Check if volunteer already exists by name & org
        existing = (
            client.table("volunteers")
            .select("id")
            .eq("organization_id", org_uuid)
            .eq("name", v["name"])
            .execute()
        )
        if not existing.data:
            res = client.table("volunteers").insert(v).execute()
            logger.info(f"✅ Inserted volunteer: {v['name']} (ID: {res.data[0]['id']})")
        else:
            logger.info(f"ℹ️ Volunteer already exists: {v['name']}")

    # Seed needs
    logger.info("🌱 Seeding needs...")
    for n in needs_data:
        n["organization_id"] = org_uuid
        existing = (
            client.table("needs")
            .select("id")
            .eq("organization_id", org_uuid)
            .eq("need_type", n["need_type"])
            .eq("zone", n["zone"])
            .execute()
        )
        if not existing.data:
            res = client.table("needs").insert(n).execute()
            logger.info(f"✅ Inserted need: {n['need_type']} in {n['zone']} (ID: {res.data[0]['id']})")
        else:
            logger.info(f"ℹ️ Need already exists: {n['need_type']} in {n['zone']}")

    logger.info("\n🎉 Supabase seeding complete!")


if __name__ == "__main__":
    seed_supabase()
