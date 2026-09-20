"""VolunteerBridge API — AI-powered volunteer coordination platform.

FastAPI application with endpoints for survey ingestion, volunteer matching,
task assignment, and crisis intelligence reporting backed by Supabase PostgreSQL.
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Dict, List

import firebase_admin
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, firestore

from models.schemas import (
    AssignRequest,
    CommunityNeed,
    CrisisReport,
    IngestRequest,
    IngestResponse,
    MatchExplainRequest,
    MatchExplainResponse,
    MatchRequest,
    MatchResult,
    Volunteer,
)
from services.fcm import send_task_notification
from services.gemini import (
    extract_need_from_image,
    extract_need_from_text,
    generate_crisis_report,
)
from services.matching import match_volunteers
from services.supabase import (
    create_assignment,
    create_need,
    create_notification,
    get_available_volunteers_by_org,
    get_need_by_id,
    get_needs_by_org,
    get_unassigned_needs,
    get_volunteer_by_id,
    get_volunteers_by_org,
    update_assignment_status,
    update_need_status,
    update_volunteer_availability,
)

load_dotenv(override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Legacy Firebase Admin SDK Initialization (Kept for fallback/transition)
db = None
try:
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if service_account_json:
        import json as _json
        service_account_info = _json.loads(service_account_json)
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase initialized with credentials from environment variable.")
    else:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./serviceAccountKey.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            logger.info(f"Firebase initialized with service account file: {cred_path}")
except Exception as e:
    logger.warning(f"Firebase initialization skipped or failed: {e}. Operating in Supabase mode.")

# Initialize Gemini AI
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    try:
        genai.configure(api_key=gemini_api_key)
        logger.info("Gemini AI configured.")
    except Exception as e:
        logger.error(f"Gemini configuration failed: {e}")
else:
    logger.warning("GEMINI_API_KEY not set. AI features will not work.")

# Create FastAPI app
app = FastAPI(
    title="VolunteerBridge API",
    description="AI-powered volunteer coordination platform for NGOs (Supabase Engine)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> Dict:
    """Health check endpoint returning service status and database engine."""
    return {
        "status": "ok",
        "service": "VolunteerBridge API",
        "version": "2.0.0",
        "database": "Supabase PostgreSQL",
    }


@app.post("/ingest", response_model=IngestResponse)
async def ingest_survey(request: IngestRequest) -> IngestResponse:
    """Ingest survey data (image or text) and extract community needs using Gemini AI.

    The extracted data is validated, stored in Supabase PostgreSQL, and returned
    with a confidence score. Low-confidence extractions are flagged for human review.
    """
    try:
        if request.image_base64:
            extraction = await asyncio.to_thread(extract_need_from_image, request.image_base64)
        elif request.text_content:
            extraction = await asyncio.to_thread(extract_need_from_text, request.text_content)
        else:
            raise HTTPException(
                status_code=400,
                detail="Either image_base64 or text_content must be provided.",
            )
    except Exception as exc:
        logger.error("Gemini extraction failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"AI extraction failed: {str(exc)}",
        )

    confidence = extraction.get("confidence_score", 0.5)

    need_dict = {
        "need_type": extraction.get("need_type", "Unknown"),
        "urgency_score": min(max(int(extraction.get("urgency_score", 5)), 1), 10),
        "required_skills": extraction.get("required_skills", ["General Support"]),
        "location": {
            "lat": 0.0,
            "lng": 0.0,
            "zone": extraction.get("gps_zone", "Unknown Zone"),
        },
        "volunteer_hours_needed": float(extraction.get("volunteer_hours_needed", 4.0)),
        "confidence_score": confidence,
        "raw_text": extraction.get("raw_extracted_text", ""),
        "status": "unassigned",
        "org_id": request.org_id,
        "reported_by": request.reported_by,
    }

    try:
        saved_row = await asyncio.to_thread(create_need, need_dict)
    except Exception as exc:
        logger.error("Failed to save need in Supabase: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(exc)}")

    need = CommunityNeed(
        id=saved_row["id"],
        need_type=saved_row["need_type"],
        urgency_score=saved_row["urgency_score"],
        required_skills=saved_row["required_skills"],
        location=saved_row["location"],
        volunteer_hours_needed=saved_row["volunteer_hours_needed"],
        confidence_score=saved_row["confidence_score"],
        raw_text=saved_row["raw_text"],
        status=saved_row["status"],
        org_id=request.org_id,
        reported_by=saved_row.get("reported_by"),
        created_at=datetime.now(timezone.utc),
    )

    # Trigger In-App Notifications
    try:
        urgency = saved_row.get("urgency_score", 5)
        need_type = saved_row.get("need_type", "Community Need")
        zone = saved_row.get("location", {}).get("zone", "Zone")
        
        # Notify NGO Admin
        is_crit = urgency >= 8
        await asyncio.to_thread(
            create_notification,
            org_id=request.org_id,
            title="Critical Need Reported" if is_crit else "New Community Need",
            message=f"{'CRITICAL: ' if is_crit else ''}New {need_type} request reported in {zone} (Urgency: {urgency}/10).",
            type_str="CRITICAL_NEED" if is_crit else "NEW_NEED",
            need_id=saved_row["id"],
        )

        # Notify Reporting USER
        if request.reported_by:
            await asyncio.to_thread(
                create_notification,
                recipient_id=request.reported_by,
                org_id=request.org_id,
                title="Request Received",
                message=f"Your request for '{need_type}' has been received by the response team.",
                type_str="NEED_STATUS_UPDATE",
                need_id=saved_row["id"],
            )
    except Exception as n_exc:
        logger.warning("Failed to trigger ingestion notification: %s", n_exc)

    review_required = confidence < 0.75

    return IngestResponse(
        need=need,
        confidence_score=confidence,
        review_required=review_required,
    )


@app.post("/match", response_model=List[MatchResult])
async def match_need_to_volunteers(request: MatchRequest) -> List[MatchResult]:
    """Find and rank the top 3 volunteer matches for a community need from Supabase.

    Uses multi-factor scoring: skill match (50%), proximity (30%),
    and reliability (20%).
    """
    try:
        need_data = await asyncio.to_thread(get_need_by_id, request.need_id, request.org_id)
    except Exception as exc:
        logger.error("Error fetching need from Supabase: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(exc)}")

    if not need_data:
        raise HTTPException(
            status_code=404,
            detail=f"Need {request.need_id} not found in organization {request.org_id}.",
        )

    try:
        volunteers = await asyncio.to_thread(get_available_volunteers_by_org, request.org_id)
    except Exception as exc:
        logger.error("Error fetching available volunteers from Supabase: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(exc)}")

    if not volunteers:
        raise HTTPException(
            status_code=404,
            detail="No available volunteers found.",
        )

    matches = match_volunteers(need_data, volunteers)

    results = []
    for match in matches:
        vol_data = match["volunteer"]
        volunteer = Volunteer(
            id=vol_data.get("id"),
            name=vol_data.get("name", "Unknown"),
            skills=vol_data.get("skills", []),
            skill_description=vol_data.get("skill_description", ""),
            location=vol_data.get("location", {"lat": 0, "lng": 0, "zone": "Unknown"}),
            availability=vol_data.get("availability", True),
            completion_rate=vol_data.get("completion_rate", 1.0),
            avg_response_minutes=vol_data.get("avg_response_minutes", 10.0),
            tasks_completed=vol_data.get("tasks_completed", 0),
            fcm_token=vol_data.get("fcm_token"),
        )
        results.append(
            MatchResult(
                volunteer=volunteer,
                overall_score=match.get("overall_score", match["final_score"]),
                skill_score=match["skill_score"],
                proximity_score=match["proximity_score"],
                reliability_score=match["reliability_score"],
                final_score=match["final_score"],
                matched_skills=match.get("matched_skills", []),
                missing_skills=match.get("missing_skills", []),
                distance=match.get("distance"),
                availability=match.get("availability", True),
                completion_rate=match.get("completion_rate", 1.0),
                tasks_completed=match.get("tasks_completed", 0),
                avg_response_minutes=match.get("avg_response_minutes", 10.0),
                match_reasons=match.get("match_reasons", []),
                travel_minutes=match.get("travel_minutes"),
                reasoning=match["reasoning"],
            )
        )

    return results


@app.post("/match/explain", response_model=MatchExplainResponse)
async def explain_volunteer_matches(request: MatchExplainRequest) -> MatchExplainResponse:
    """Generate an AI-powered operational match intelligence explanation using Gemini AI.

    Analyzes candidate rankings produced by the deterministic algorithm (50% skills,
    30% proximity, 20% reliability) and provides structured trade-off analysis.
    Gemini does NOT alter official scores or candidate rankings.
    """
    need_data = await asyncio.to_thread(get_need_by_id, request.need_id, request.org_id)
    if not need_data:
        raise HTTPException(status_code=404, detail=f"Need {request.need_id} not found.")

    volunteers = await asyncio.to_thread(get_available_volunteers_by_org, request.org_id)
    if not volunteers:
        return MatchExplainResponse(
            summary="No available volunteers found in the organization.",
            recommended_candidate=None,
            why=[],
            tradeoffs=["All registered volunteers are currently unavailable or assigned."],
            considerations=["Review volunteer availability or wait for active assignments to be completed."]
        )

    matches = match_volunteers(need_data, volunteers)
    if not matches:
        return MatchExplainResponse(
            summary="No candidate matches produced for this community need.",
            recommended_candidate=None,
            why=[],
            tradeoffs=["No active volunteers met the baseline criteria."],
            considerations=["Check required skills or expand geographic coverage."]
        )

    top_matches_text = []
    for idx, m in enumerate(matches[:3], 1):
        v = m["volunteer"]
        matched_str = ", ".join(m.get("matched_skills", [])) if m.get("matched_skills") else "None"
        missing_str = ", ".join(m.get("missing_skills", [])) if m.get("missing_skills") else "None"
        dist_str = f"{m['distance']} km" if m.get("distance") is not None else "Distance unavailable"
        top_matches_text.append(
            f"Candidate #{idx}: {v.get('name')} | Overall Match: {m['overall_score']:.0%} | "
            f"Skill Score: {m['skill_score']:.0%} (Matched: {matched_str}; Missing: {missing_str}) | "
            f"Proximity Score: {m['proximity_score']:.0%} ({dist_str}) | "
            f"Reliability Score: {m['reliability_score']:.0%} ({int(m.get('completion_rate', 1.0)*100)}% completion, {m.get('tasks_completed', 0)} tasks)"
        )

    candidates_summary = "\n".join(top_matches_text)
    need_skills_str = ", ".join(need_data.get("required_skills", [])) if need_data.get("required_skills") else "General Support"
    need_summary = (
        f"Need Type: {need_data.get('need_type')} | Urgency: {need_data.get('urgency_score')}/10 | "
        f"Zone: {need_data.get('location', {}).get('zone')} | Required Skills: {need_skills_str}"
    )

    prompt = f"""You are an NGO crisis response coordinator AI providing operational match intelligence for volunteer deployment.

Community Need:
{need_summary}

Top Deterministic Match Candidates (Scored by Algorithm: 50% Skills, 30% Proximity, 20% Reliability):
{candidates_summary}

Instructions:
1. Explain the operational tradeoffs between candidate options based strictly on the supplied data.
2. DO NOT recalculate or change candidate scores or rankings.
3. DO NOT invent facts or hallucinate missing information.
4. Return ONLY valid JSON:
{{
  "summary": "2 concise sentences explaining the candidate choices for this operational need",
  "recommended_candidate": "{matches[0]['volunteer'].get('name')}",
  "why": ["2-3 key bullet points explaining why the top candidate scored highest"],
  "tradeoffs": ["2-3 bullet points comparing candidates (e.g. comparing skill strengths vs proximity advantages)"],
  "considerations": ["1-2 operational considerations or missing skills to keep in mind"]
}}"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=512,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            start = 1
            end = len(lines) - 1
            for i, line in enumerate(lines):
                if line.strip().startswith("```") and i > 0:
                    end = i
                    break
            text = "\n".join(lines[start:end])

        import json as _json
        parsed = _json.loads(text.strip())
        return MatchExplainResponse(
            summary=parsed.get("summary", f"Top match candidate is {matches[0]['volunteer'].get('name')} with an overall match score of {matches[0]['overall_score']:.0%}."),
            recommended_candidate=parsed.get("recommended_candidate", matches[0]["volunteer"].get("name")),
            why=parsed.get("why", matches[0].get("match_reasons", [])),
            tradeoffs=parsed.get("tradeoffs", []),
            considerations=parsed.get("considerations", [])
        )
    except Exception as exc:
        logger.warning("Match explanation AI generation fallback: %s", exc)
        top_v = matches[0]
        return MatchExplainResponse(
            summary=f"{top_v['volunteer'].get('name')} is the highest-ranked candidate ({top_v['overall_score']:.0%} match score) based on skill compatibility and reliability.",
            recommended_candidate=top_v["volunteer"].get("name"),
            why=top_v.get("match_reasons", []),
            tradeoffs=[f"{top_v['volunteer'].get('name')} has strong skill match ({top_v['skill_score']:.0%})."],
            considerations=["Verify volunteer travel time and active field availability before deployment."]
        )


@app.post("/assign")
async def assign_volunteer(request: AssignRequest) -> Dict:
    """Assign a volunteer to a community need in Supabase.

    Updates database documents for both the need and volunteer,
    attempts optional legacy FCM notification, and creates an assignment record.
    """
    need_data = await asyncio.to_thread(get_need_by_id, request.need_id, request.org_id)
    if not need_data:
        raise HTTPException(status_code=404, detail=f"Need {request.need_id} not found.")

    vol_data = await asyncio.to_thread(get_volunteer_by_id, request.volunteer_id)
    if not vol_data:
        raise HTTPException(
            status_code=404, detail=f"Volunteer {request.volunteer_id} not found."
        )

    await asyncio.to_thread(update_need_status, request.need_id, "assigned")
    await asyncio.to_thread(update_volunteer_availability, request.volunteer_id, False)

    fcm_token = vol_data.get("fcm_token")
    notification_sent = False
    if fcm_token:
        try:
            notification_sent = await asyncio.to_thread(send_task_notification, fcm_token, need_data, 0.95)
        except Exception as fcm_exc:
            logger.warning("FCM notification attempt failed: %s", fcm_exc)

    try:
        assignment = await asyncio.to_thread(
            create_assignment,
            org_id=request.org_id,
            need_id=request.need_id,
            volunteer_id=request.volunteer_id,
            notification_sent=notification_sent,
        )

        # Trigger In-App Notifications
        need_type = need_data.get("need_type", "Community Need")
        zone = need_data.get("location", {}).get("zone", "Zone")
        urgency = need_data.get("urgency_score", 5)
        reported_by = need_data.get("reported_by")

        # Notify Assigned Volunteer
        vol_profile_id = vol_data.get("profile_id")
        if vol_profile_id:
            await asyncio.to_thread(
                create_notification,
                recipient_id=vol_profile_id,
                org_id=request.org_id,
                title="New Task Assigned",
                message=f"You have been assigned to '{need_type}' in {zone} (Urgency: {urgency}/10).",
                type_str="TASK_ASSIGNED",
                need_id=request.need_id,
                assignment_id=assignment["id"],
            )

        # Notify Reporting User
        if reported_by:
            await asyncio.to_thread(
                create_notification,
                recipient_id=reported_by,
                org_id=request.org_id,
                title="Request Assigned",
                message=f"Your request for '{need_type}' has been assigned to a volunteer response team.",
                type_str="NEED_STATUS_UPDATE",
                need_id=request.need_id,
                assignment_id=assignment["id"],
            )
    except Exception as exc:
        logger.error("Failed to create assignment record in Supabase: %s", exc)
        raise HTTPException(status_code=500, detail=f"Assignment failed: {str(exc)}")

    return {
        "success": True,
        "assignment_id": assignment["id"],
        "notification_sent": notification_sent,
    }


@app.post("/assignment/status")
async def update_assignment_status_endpoint(request: Dict) -> Dict:
    """Update status of an assignment ('in_progress' or 'completed').
    Synchronously updates both the assignment record, the associated need,
    and updates volunteer availability when completed.
    """
    assignment_id = request.get("assignment_id")
    status = request.get("status")

    if not assignment_id or not status:
        raise HTTPException(status_code=400, detail="assignment_id and status are required.")

    if status not in ["assigned", "in_progress", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    try:
        success = await asyncio.to_thread(update_assignment_status, assignment_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Assignment not found.")
        return {"success": True, "assignment_id": assignment_id, "status": status}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to update assignment status: %s", exc)
        raise HTTPException(status_code=500, detail=f"Status update failed: {str(exc)}")


@app.get("/crisis-report/{org_id}", response_model=CrisisReport)
async def get_crisis_report_endpoint(org_id: str) -> CrisisReport:
    """Generate an AI-powered crisis situation report from active needs in Supabase.

    Requires at least 3 active (unassigned) needs to produce a meaningful report.
    """
    try:
        needs = await asyncio.to_thread(get_unassigned_needs, org_id)
    except Exception as exc:
        logger.error("Error fetching unassigned needs from Supabase: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(exc)}")

    if len(needs) < 3:
        raise HTTPException(
            status_code=400,
            detail="Not enough active needs for report. At least 3 unassigned needs required.",
        )

    report_data = await asyncio.to_thread(generate_crisis_report, needs)

    return CrisisReport(
        zone=report_data.get("zone", "Unknown"),
        total_needs=report_data.get("total_needs", len(needs)),
        critical_needs=report_data.get("critical_needs", 0),
        skill_gaps=report_data.get("skill_gaps", []),
        recommended_actions=report_data.get("recommended_actions", []),
        predicted_escalation=report_data.get(
            "predicted_escalation", "Unable to predict."
        ),
        generated_at=datetime.now(timezone.utc),
    )


@app.get("/needs/{org_id}", response_model=List[CommunityNeed])
async def get_needs(org_id: str) -> List[CommunityNeed]:
    """Fetch all community needs for an organization from Supabase, sorted by urgency."""
    try:
        data_list = await asyncio.to_thread(get_needs_by_org, org_id)
    except Exception as exc:
        logger.error("Error fetching needs from Supabase: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(exc)}")

    needs: List[CommunityNeed] = []
    for data in data_list:
        needs.append(
            CommunityNeed(
                id=data.get("id"),
                need_type=data.get("need_type", "Unknown"),
                urgency_score=data.get("urgency_score", 5),
                required_skills=data.get("required_skills", []),
                location=data.get("location", {"lat": 0, "lng": 0, "zone": "Unknown"}),
                volunteer_hours_needed=data.get("volunteer_hours_needed", 0),
                confidence_score=data.get("confidence_score"),
                raw_text=data.get("raw_text"),
                status=data.get("status", "unassigned"),
                org_id=org_id,
                created_at=data.get("created_at"),
            )
        )

    return needs


@app.get("/volunteers/{org_id}", response_model=List[Volunteer])
async def get_volunteers(org_id: str) -> List[Volunteer]:
    """Fetch all volunteers registered under an organization from Supabase."""
    try:
        data_list = await asyncio.to_thread(get_volunteers_by_org, org_id)
    except Exception as exc:
        logger.error("Error fetching volunteers from Supabase: %s", exc)
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(exc)}")

    volunteers: List[Volunteer] = []
    for data in data_list:
        volunteers.append(
            Volunteer(
                id=data.get("id"),
                name=data.get("name", "Unknown"),
                skills=data.get("skills", []),
                skill_description=data.get("skill_description", ""),
                location=data.get("location", {"lat": 0, "lng": 0, "zone": "Unknown"}),
                availability=data.get("availability", True),
                completion_rate=data.get("completion_rate", 1.0),
                avg_response_minutes=data.get("avg_response_minutes", 10.0),
                tasks_completed=data.get("tasks_completed", 0),
                fcm_token=data.get("fcm_token"),
            )
        )

    return volunteers


@app.post("/parse-command")
async def parse_command(request: Dict) -> Dict:
    """Parse a natural language command into a structured dashboard action using Gemini AI."""
    user_input = request.get("input", "")

    if not user_input.strip():
        return {
            "action": "ai_response",
            "response": "Please type a command.",
            "label": "Empty command",
        }

    import json as _json

    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    prompt = f"""You are a command parser for an NGO crisis coordination dashboard called VolunteerBridge.
Parse this natural language command into a structured action.

Available actions:
- navigate: go to a dashboard page. paths: /dashboard, /dashboard/map, /dashboard/upload, /dashboard/intelligence
- filter_map: filter the crisis map by need_type, zone, urgency_min, status
- show_volunteers: filter volunteers by skill, availability, zone
- assign: assign a volunteer to a need
- generate_report: generate AI crisis intelligence report
- show_stats: show impact statistics
- ai_response: for questions that need a direct answer

Return ONLY valid JSON:
{{
  "action": "navigate" | "filter_map" | "show_volunteers" | "assign" | "generate_report" | "show_stats" | "ai_response",
  "path": null,
  "filters": {{"need_type": null, "zone": null, "urgency_min": null, "status": null, "skill": null, "available": null}},
  "response": null,
  "label": "Human readable description of what this does"
}}

Command: {user_input}"""

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=512,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            start = 1
            end = len(lines) - 1
            for i, line in enumerate(lines):
                if line.strip().startswith("```") and i > 0:
                    end = i
                    break
            text = "\n".join(lines[start:end])
        parsed = _json.loads(text.strip())
        return parsed
    except Exception as exc:
        logger.warning("Command parse fallback: %s", exc)
        return {
            "action": "ai_response",
            "response": f"I understood you want to: {user_input}. Try being more specific.",
            "label": "AI Response",
        }


@app.post("/briefing")
async def generate_briefing(request: Dict) -> Dict:
    """Generate a personalized AI volunteer briefing using Gemini and real Supabase operational data."""
    org_id = request.get("org_id", "default")

    # Fetch real operational data from Supabase
    db_needs = []
    db_volunteers = []
    try:
        db_needs = get_unassigned_needs(org_id)
        db_volunteers = get_available_volunteers_by_org(org_id)
    except Exception as e:
        logger.warning(f"Could not fetch Supabase data for briefing: {e}")

    total_unassigned = len(db_needs)
    critical_count = sum(1 for n in db_needs if n.get("urgency_score", 0) >= 8)
    available_vol_count = len(db_volunteers)

    # Compute real skill gaps from Supabase active needs vs available volunteers
    req_skills = set()
    for n in db_needs:
        for s in n.get("required_skills", []):
            req_skills.add(s)

    vol_skills = set()
    for v in db_volunteers:
        for s in v.get("skills", []):
            vol_skills.add(s)

    missing_skills = list(req_skills - vol_skills)
    skill_gap_text = ", ".join(missing_skills) if missing_skills else "None identified"

    volunteer_name = request.get("volunteer_name", "Volunteer Coordinator")
    volunteer_skills = request.get("skills", ["Field Operations"])
    tasks_completed = request.get("tasks_completed", 0)
    need_type = request.get(
        "need_type",
        db_needs[0].get("need_type", "Community Support") if db_needs else "Community Need",
    )
    need_zone = request.get(
        "zone",
        db_needs[0].get("location", {}).get("zone", "Active Operations Zone")
        if db_needs
        else "the area",
    )
    urgency_score = request.get(
        "urgency_score", db_needs[0].get("urgency_score", 8) if db_needs else 8
    )
    raw_text = request.get(
        "raw_text", db_needs[0].get("raw_text", "") if db_needs else ""
    )
    nearby_volunteers = request.get(
        "nearby_volunteers", [v.get("name") for v in db_volunteers[:3] if v.get("name")]
    )

    nearby_text = ", ".join(nearby_volunteers) if nearby_volunteers else "none"
    skills_text = ", ".join(volunteer_skills) if volunteer_skills else "general support"
    situation_detail = (
        raw_text
        if raw_text
        else f"A {need_type} situation requiring immediate attention in {need_zone}"
    )

    prompt = f"""You are a crisis coordinator AI generating an operational field briefing for NGO coordination.

Real Operations Data:
- Active Unassigned Needs: {total_unassigned} (Critical Needs: {critical_count})
- Available Volunteers: {available_vol_count}
- Real Skill Shortages: {skill_gap_text}
- Primary Target Zone: {need_zone}
- Priority Need Type: {need_type} (Urgency: {urgency_score}/10)
- Field Situation Details: {situation_detail}
- Recipient Volunteer/Coordinator: {volunteer_name}
- Volunteer Skills: {skills_text}
- Nearby Field Volunteers: {nearby_text}

Generate a concise operational briefing. Return ONLY valid JSON:
{{
  "situation": "2-3 sentence description of current unassigned needs ({total_unassigned} total, {critical_count} critical) and priority zones based on real data",
  "your_role": "1-2 sentences directing {volunteer_name} on priority response actions utilizing their skills ({skills_text})",
  "what_to_expect": "2-3 practical sentences on field conditions, urgent tasks, and key skill gaps ({skill_gap_text})",
  "coordinate_with": "mention nearby volunteers ({nearby_text}) or available teams ({available_vol_count} volunteers available)",
  "safety_note": "one critical safety consideration relevant to urgency {urgency_score}/10 in {need_zone}"
}}

Keep total response under 200 words."""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=512,
            ),
        )
        text = response.text.strip()
        if "```" in text:
            lines = text.split("\n")
            start = 0
            end = len(lines)
            for i, line in enumerate(lines):
                if line.strip().startswith("```") and i == 0:
                    start = 1
                elif line.strip().startswith("```") and i > 0:
                    end = i
                    break
            text = "\n".join(lines[start:end])

        import json as _json

        parsed = _json.loads(text.strip())
        return parsed
    except Exception as exc:
        logger.warning("Briefing generation fallback: %s", exc)
        return {
            "situation": f"{total_unassigned} active unassigned needs in {need_zone} ({critical_count} critical). Priority: {need_type}.",
            "your_role": f"{volunteer_name}, utilize your skills in {skills_text} to support response efforts.",
            "what_to_expect": f"Prepare for active deployment. Identified skill gaps: {skill_gap_text}.",
            "coordinate_with": f"Coordinate with nearby volunteers: {nearby_text} ({available_vol_count} available).",
            "safety_note": f"Maintain safety protocols for urgency {urgency_score}/10 operations in {need_zone}.",
        }

