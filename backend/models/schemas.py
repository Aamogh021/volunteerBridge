"""Pydantic v2 schemas for the VolunteerBridge API."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Location(BaseModel):
    """Geographic location with zone identifier."""
    lat: float
    lng: float
    zone: str


class CommunityNeed(BaseModel):
    """A community need extracted from survey data or manual input."""
    id: Optional[str] = None
    need_type: str
    urgency_score: int = Field(ge=1, le=10, description="Urgency level from 1 (low) to 10 (critical)")
    required_skills: List[str]
    location: Location
    volunteer_hours_needed: float
    confidence_score: Optional[float] = None
    raw_text: Optional[str] = None
    status: str = "unassigned"
    org_id: str = "default"
    reported_by: Optional[str] = None
    created_at: Optional[datetime] = None


class Volunteer(BaseModel):
    """A registered volunteer with skills and availability metadata."""
    id: Optional[str] = None
    name: str
    skills: List[str]
    skill_description: str
    location: Location
    availability: bool = True
    completion_rate: float = 1.0
    avg_response_minutes: float = 10.0
    tasks_completed: int = 0
    embedding_vector: Optional[List[float]] = None
    fcm_token: Optional[str] = None


class MatchResult(BaseModel):
    """Result of matching a volunteer to a community need."""
    volunteer: Volunteer
    overall_score: float = 0.0
    skill_score: float
    proximity_score: float
    reliability_score: float
    final_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    distance: Optional[float] = None
    availability: bool = True
    completion_rate: float = 1.0
    tasks_completed: int = 0
    avg_response_minutes: float = 10.0
    match_reasons: List[str] = []
    travel_minutes: Optional[float] = None
    reasoning: str


class MatchExplainRequest(BaseModel):
    """Request payload for AI match intelligence explanation."""
    need_id: str
    org_id: str = "default"


class MatchExplainResponse(BaseModel):
    """AI explanation response detailing candidate tradeoffs and considerations."""
    summary: str
    recommended_candidate: Optional[str] = None
    why: List[str] = []
    tradeoffs: List[str] = []
    considerations: List[str] = []


class IngestRequest(BaseModel):
    """Request body for survey data ingestion."""
    image_base64: Optional[str] = None
    text_content: Optional[str] = None
    org_id: str = "default"
    reported_by: Optional[str] = None


class IngestResponse(BaseModel):
    """Response from survey ingestion with extraction results."""
    need: CommunityNeed
    confidence_score: float
    review_required: bool


class MatchRequest(BaseModel):
    """Request to match volunteers to a specific community need."""
    need_id: str
    org_id: str = "default"


class AssignRequest(BaseModel):
    """Request to assign a volunteer to a community need."""
    need_id: str
    volunteer_id: str
    org_id: str = "default"


class CrisisReport(BaseModel):
    """AI-generated crisis situation report."""
    zone: str
    total_needs: int
    critical_needs: int
    skill_gaps: List[str]
    recommended_actions: List[str]
    predicted_escalation: str
    generated_at: datetime
