"""Supabase database service module for VolunteerBridge backend."""

import os
import logging
import uuid
from typing import Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

_supabase_client: Optional[Client] = None
_default_org_uuid_cache: Optional[str] = None


def get_supabase_client() -> Client:
    """Get or initialize the Supabase client using service role key."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured.")
        raise RuntimeError("Supabase client is not configured in environment variables.")

    _supabase_client = create_client(url, key)
    return _supabase_client


def is_valid_uuid(val: str) -> bool:
    """Check if string is a valid UUID."""
    try:
        uuid.UUID(val)
        return True
    except (ValueError, TypeError):
        return False


def resolve_org_id(org_id_or_slug: str) -> str:
    """Resolve an organization ID/slug (e.g. 'default') to a valid Supabase Organization UUID."""
    global _default_org_uuid_cache

    if is_valid_uuid(org_id_or_slug):
        return org_id_or_slug

    if org_id_or_slug == "default" and _default_org_uuid_cache:
        return _default_org_uuid_cache

    client = get_supabase_client()
    try:
        # Check if default org exists
        res = client.table("organizations").select("id").eq("slug", org_id_or_slug).execute()
        if res.data and len(res.data) > 0:
            org_uuid = res.data[0]["id"]
            if org_id_or_slug == "default":
                _default_org_uuid_cache = org_uuid
            return org_uuid

        # Create default organization if not found
        new_org = {
            "name": "Default Organization",
            "slug": org_id_or_slug,
            "contact_email": "admin@volunteerbridge.org",
        }
        insert_res = client.table("organizations").insert(new_org).execute()
        if insert_res.data and len(insert_res.data) > 0:
            org_uuid = insert_res.data[0]["id"]
            if org_id_or_slug == "default":
                _default_org_uuid_cache = org_uuid
            logger.info("Created missing default organization with UUID: %s", org_uuid)
            return org_uuid
        
        raise RuntimeError(f"Failed to create organization for slug: {org_id_or_slug}")
    except Exception as exc:
        logger.error("Error resolving organization ID: %s", exc)
        raise


def get_needs_by_org(org_id: str) -> List[Dict]:
    """Fetch all community needs for an organization, ordered by urgency."""
    org_uuid = resolve_org_id(org_id)
    client = get_supabase_client()
    res = (
        client.table("needs")
        .select("*")
        .eq("organization_id", org_uuid)
        .order("urgency_score", desc=True)
        .execute()
    )

    needs = []
    for row in res.data or []:
        needs.append({
            "id": row["id"],
            "need_type": row.get("need_type", "Unknown"),
            "urgency_score": row.get("urgency_score", 5),
            "required_skills": row.get("required_skills") or [],
            "location": {
                "lat": row.get("latitude", 0.0),
                "lng": row.get("longitude", 0.0),
                "zone": row.get("zone", "Unknown"),
            },
            "volunteer_hours_needed": row.get("volunteer_hours_needed", 4.0),
            "confidence_score": row.get("confidence_score"),
            "raw_text": row.get("raw_text"),
            "status": row.get("status", "unassigned"),
            "org_id": org_id,
            "reported_by": row.get("reported_by"),
            "created_at": row.get("created_at"),
        })
    return needs


def get_need_by_id(need_id: str, org_id: str = "default") -> Optional[Dict]:
    """Fetch a single need by ID."""
    client = get_supabase_client()
    res = client.table("needs").select("*").eq("id", need_id).execute()
    if not res.data:
        return None

    row = res.data[0]
    return {
        "id": row["id"],
        "need_type": row.get("need_type", "Unknown"),
        "urgency_score": row.get("urgency_score", 5),
        "required_skills": row.get("required_skills") or [],
        "location": {
            "lat": row.get("latitude", 0.0),
            "lng": row.get("longitude", 0.0),
            "zone": row.get("zone", "Unknown"),
        },
        "volunteer_hours_needed": row.get("volunteer_hours_needed", 4.0),
        "confidence_score": row.get("confidence_score"),
        "raw_text": row.get("raw_text"),
        "status": row.get("status", "unassigned"),
        "org_id": org_id,
        "reported_by": row.get("reported_by"),
        "created_at": row.get("created_at"),
    }


def create_need(need_data: Dict) -> Dict:
    """Create a new community need record in Supabase."""
    org_id = need_data.get("org_id", "default")
    org_uuid = resolve_org_id(org_id)
    location = need_data.get("location", {})

    record = {
        "organization_id": org_uuid,
        "need_type": need_data.get("need_type", "Unknown"),
        "urgency_score": need_data.get("urgency_score", 5),
        "required_skills": need_data.get("required_skills", []),
        "latitude": location.get("lat", 0.0),
        "longitude": location.get("lng", 0.0),
        "zone": location.get("zone", "Unknown Zone"),
        "volunteer_hours_needed": need_data.get("volunteer_hours_needed", 4.0),
        "confidence_score": need_data.get("confidence_score"),
        "raw_text": need_data.get("raw_text", ""),
        "status": need_data.get("status", "unassigned"),
    }
    if need_data.get("reported_by"):
        record["reported_by"] = need_data.get("reported_by")

    client = get_supabase_client()
    res = client.table("needs").insert(record).execute()
    if not res.data:
        raise RuntimeError("Failed to insert need into Supabase")

    row = res.data[0]
    return {
        "id": row["id"],
        "need_type": row.get("need_type", "Unknown"),
        "urgency_score": row.get("urgency_score", 5),
        "required_skills": row.get("required_skills") or [],
        "location": {
            "lat": row.get("latitude", 0.0),
            "lng": row.get("longitude", 0.0),
            "zone": row.get("zone", "Unknown"),
        },
        "volunteer_hours_needed": row.get("volunteer_hours_needed", 4.0),
        "confidence_score": row.get("confidence_score"),
        "raw_text": row.get("raw_text"),
        "status": row.get("status", "unassigned"),
        "org_id": org_id,
        "reported_by": row.get("reported_by"),
        "created_at": row.get("created_at"),
    }


def update_need_status(need_id: str, status: str) -> bool:
    """Update the status of a need."""
    client = get_supabase_client()
    res = client.table("needs").update({"status": status}).eq("id", need_id).execute()
    return bool(res.data)


def get_volunteers_by_org(org_id: str) -> List[Dict]:
    """Fetch all volunteers registered under an organization."""
    org_uuid = resolve_org_id(org_id)
    client = get_supabase_client()
    res = client.table("volunteers").select("*").eq("organization_id", org_uuid).execute()

    volunteers = []
    for row in res.data or []:
        volunteers.append({
            "id": row["id"],
            "name": row.get("name", "Unknown"),
            "skills": row.get("skills") or [],
            "skill_description": row.get("skill_description", ""),
            "location": {
                "lat": row.get("latitude", 0.0),
                "lng": row.get("longitude", 0.0),
                "zone": row.get("zone", "Unknown"),
            },
            "availability": row.get("availability", True),
            "completion_rate": row.get("completion_rate", 1.0),
            "avg_response_minutes": row.get("avg_response_minutes", 10.0),
            "tasks_completed": row.get("tasks_completed", 0),
            "fcm_token": row.get("fcm_token"),
        })
    return volunteers


def get_available_volunteers_by_org(org_id: str) -> List[Dict]:
    """Fetch all available volunteers for matching."""
    org_uuid = resolve_org_id(org_id)
    client = get_supabase_client()
    res = (
        client.table("volunteers")
        .select("*")
        .eq("organization_id", org_uuid)
        .eq("availability", True)
        .execute()
    )

    volunteers = []
    for row in res.data or []:
        volunteers.append({
            "id": row["id"],
            "name": row.get("name", "Unknown"),
            "skills": row.get("skills") or [],
            "skill_description": row.get("skill_description", ""),
            "location": {
                "lat": row.get("latitude", 0.0),
                "lng": row.get("longitude", 0.0),
                "zone": row.get("zone", "Unknown"),
            },
            "availability": row.get("availability", True),
            "completion_rate": row.get("completion_rate", 1.0),
            "avg_response_minutes": row.get("avg_response_minutes", 10.0),
            "tasks_completed": row.get("tasks_completed", 0),
            "fcm_token": row.get("fcm_token"),
        })
    return volunteers


def get_volunteer_by_id(volunteer_id: str) -> Optional[Dict]:
    """Fetch a single volunteer by ID."""
    client = get_supabase_client()
    res = client.table("volunteers").select("*").eq("id", volunteer_id).execute()
    if not res.data:
        return None

    row = res.data[0]
    return {
        "id": row["id"],
        "name": row.get("name", "Unknown"),
        "skills": row.get("skills") or [],
        "skill_description": row.get("skill_description", ""),
        "location": {
            "lat": row.get("latitude", 0.0),
            "lng": row.get("longitude", 0.0),
            "zone": row.get("zone", "Unknown"),
        },
        "availability": row.get("availability", True),
        "completion_rate": row.get("completion_rate", 1.0),
        "avg_response_minutes": row.get("avg_response_minutes", 10.0),
        "tasks_completed": row.get("tasks_completed", 0),
        "fcm_token": row.get("fcm_token"),
    }


def update_volunteer_availability(volunteer_id: str, availability: bool) -> bool:
    """Update volunteer availability status."""
    client = get_supabase_client()
    res = client.table("volunteers").update({"availability": availability}).eq("id", volunteer_id).execute()
    return bool(res.data)


def create_assignment(org_id: str, need_id: str, volunteer_id: str, notification_sent: bool = False) -> Dict:
    """Create an assignment record in Supabase, returning existing if already present."""
    client = get_supabase_client()
    existing = client.table("assignments").select("*").eq("need_id", need_id).execute()
    if existing.data and len(existing.data) > 0:
        row = existing.data[0]
        logger.info("Assignment already exists for need %s", need_id)
        return {
            "id": row["id"],
            "need_id": row["need_id"],
            "volunteer_id": row["volunteer_id"],
            "status": row.get("status", "assigned"),
            "notification_sent": row.get("notification_sent", False),
            "assigned_at": row.get("assigned_at"),
        }

    org_uuid = resolve_org_id(org_id)
    record = {
        "organization_id": org_uuid,
        "need_id": need_id,
        "volunteer_id": volunteer_id,
        "status": "assigned",
        "notification_sent": notification_sent,
    }

    res = client.table("assignments").insert(record).execute()
    if not res.data:
        raise RuntimeError("Failed to insert assignment into Supabase")

    row = res.data[0]
    return {
        "id": row["id"],
        "need_id": row["need_id"],
        "volunteer_id": row["volunteer_id"],
        "status": row.get("status", "assigned"),
        "notification_sent": row.get("notification_sent", False),
        "assigned_at": row.get("assigned_at"),
    }


def create_notification(
    title: str,
    message: str,
    type_str: str,
    recipient_id: Optional[str] = None,
    org_id: str = "default",
    need_id: Optional[str] = None,
    assignment_id: Optional[str] = None,
) -> Optional[Dict]:
    """Create an in-app notification record in Supabase."""
    try:
        org_uuid = resolve_org_id(org_id)
        client = get_supabase_client()
        record = {
            "organization_id": org_uuid,
            "title": title,
            "message": message,
            "type": type_str,
            "read": False,
        }
        if recipient_id:
            record["recipient_id"] = recipient_id
        if need_id:
            record["need_id"] = need_id
        if assignment_id:
            record["assignment_id"] = assignment_id

        res = client.table("notifications").insert(record).execute()
        if res.data:
            return res.data[0]
    except Exception as exc:
        logger.warning("Failed to create notification: %s", exc)
    return None


def update_assignment_status(assignment_id: str, status: str) -> bool:
    """Update assignment status and synchronously update associated need and volunteer status."""
    from datetime import datetime, timezone
    client = get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    res = client.table("assignments").select("need_id, volunteer_id, organization_id").eq("id", assignment_id).execute()
    if not res.data:
        return False
    
    row = res.data[0]
    need_id = row["need_id"]
    volunteer_id = row["volunteer_id"]
    org_id = row.get("organization_id", "default")

    update_data = {"status": status, "updated_at": now_iso}
    if status == "in_progress":
        update_data["accepted_at"] = now_iso
    elif status == "completed":
        update_data["completed_at"] = now_iso

    client.table("assignments").update(update_data).eq("id", assignment_id).execute()
    client.table("needs").update({"status": status, "updated_at": now_iso}).eq("id", need_id).execute()

    if status == "completed":
        client.table("volunteers").update({"availability": True}).eq("id", volunteer_id).execute()

    # Trigger Notifications
    try:
        need_res = client.table("needs").select("need_type, zone, reported_by").eq("id", need_id).execute()
        if need_res.data:
            n_row = need_res.data[0]
            need_type = n_row.get("need_type", "Community Need")
            zone = n_row.get("zone", "Zone")
            reported_by = n_row.get("reported_by")

            if status == "in_progress":
                if reported_by:
                    create_notification(
                        recipient_id=reported_by,
                        title="Request In Progress",
                        message=f"Your request for '{need_type}' is now in progress.",
                        type_str="NEED_STATUS_UPDATE",
                        need_id=need_id,
                        assignment_id=assignment_id,
                    )
                create_notification(
                    org_id=org_id,
                    title="Task In Progress",
                    message=f"Volunteer started task for '{need_type}' in {zone}.",
                    type_str="TASK_STATUS_UPDATE",
                    need_id=need_id,
                    assignment_id=assignment_id,
                )
            elif status == "completed":
                if reported_by:
                    create_notification(
                        recipient_id=reported_by,
                        title="Request Completed",
                        message=f"Your request for '{need_type}' has been completed by the response team!",
                        type_str="NEED_STATUS_UPDATE",
                        need_id=need_id,
                        assignment_id=assignment_id,
                    )
                create_notification(
                    org_id=org_id,
                    title="Task Completed",
                    message=f"Volunteer task for '{need_type}' in {zone} has been completed.",
                    type_str="TASK_STATUS_UPDATE",
                    need_id=need_id,
                    assignment_id=assignment_id,
                )
    except Exception as n_exc:
        logger.warning("Failed to trigger assignment status notification: %s", n_exc)

    return True


def get_unassigned_needs(org_id: str) -> List[Dict]:
    """Fetch unassigned community needs for crisis report generation."""
    org_uuid = resolve_org_id(org_id)
    client = get_supabase_client()
    res = (
        client.table("needs")
        .select("*")
        .eq("organization_id", org_uuid)
        .eq("status", "unassigned")
        .execute()
    )

    needs = []
    for row in res.data or []:
        needs.append({
            "id": row["id"],
            "need_type": row.get("need_type", "Unknown"),
            "urgency_score": row.get("urgency_score", 5),
            "required_skills": row.get("required_skills") or [],
            "location": {
                "lat": row.get("latitude", 0.0),
                "lng": row.get("longitude", 0.0),
                "zone": row.get("zone", "Unknown"),
            },
            "volunteer_hours_needed": row.get("volunteer_hours_needed", 4.0),
            "confidence_score": row.get("confidence_score"),
            "raw_text": row.get("raw_text"),
            "status": row.get("status", "unassigned"),
            "org_id": org_id,
            "created_at": row.get("created_at"),
        })
    return needs
