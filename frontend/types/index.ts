/**
 * Core TypeScript type definitions for VolunteerBridge.
 * These mirror the backend Pydantic schemas exactly.
 */

export interface Location {
  lat: number;
  lng: number;
  zone: string;
}

export interface CommunityNeed {
  id: string | null;
  need_type: string;
  urgency_score: number;
  required_skills: string[];
  location: Location;
  volunteer_hours_needed: number;
  confidence_score: number | null;
  raw_text: string | null;
  status: string;
  org_id: string;
  created_at: string | null;
}

export interface Volunteer {
  id: string | null;
  name: string;
  skills: string[];
  skill_description: string;
  location: Location;
  availability: boolean;
  completion_rate: number;
  avg_response_minutes: number;
  tasks_completed: number;
  embedding_vector: number[] | null;
  fcm_token: string | null;
}

export interface MatchResult {
  volunteer: Volunteer;
  overall_score?: number;
  skill_score: number;
  proximity_score: number;
  reliability_score: number;
  final_score: number;
  matched_skills?: string[];
  missing_skills?: string[];
  distance?: number | null;
  availability?: boolean;
  completion_rate?: number;
  tasks_completed?: number;
  avg_response_minutes?: number;
  match_reasons?: string[];
  travel_minutes: number | null;
  reasoning: string;
}

export interface MatchExplanation {
  summary: string;
  recommended_candidate?: string | null;
  why: string[];
  tradeoffs: string[];
  considerations: string[];
}

export interface IngestResponse {
  need: CommunityNeed;
  confidence_score: number;
  review_required: boolean;
}

export interface CrisisReport {
  zone: string;
  total_needs: number;
  critical_needs: number;
  skill_gaps: string[];
  recommended_actions: string[];
  predicted_escalation: string;
  generated_at: string;
}

export type UserRole = "VOLUNTEER" | "NGO_ADMIN" | "USER";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id: string | null;
  avatar_url: string | null;
  created_at?: string;
}

export interface Assignment {
  id: string;
  need_id: string;
  volunteer_id: string;
  assigned_at: string;
  status: string;
  notification_sent: boolean;
}

export interface AppNotification {
  id: string;
  recipient_id: string | null;
  organization_id: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  need_id: string | null;
  assignment_id: string | null;
  created_at: string;
  read_at: string | null;
}

