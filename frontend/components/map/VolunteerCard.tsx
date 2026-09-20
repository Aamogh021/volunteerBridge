import type { MatchResult } from "@/types";
import MatchScoreBar from "./MatchScoreBar";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
  Award,
  UserCheck,
} from "lucide-react";

interface VolunteerCardProps {
  match: MatchResult;
  rank: number;
  assigning?: boolean;
  onAssign: () => void;
}

export default function VolunteerCard({
  match,
  rank,
  assigning = false,
  onAssign,
}: VolunteerCardProps) {
  const { volunteer } = match;
  const initials = volunteer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const overallScorePct = Math.round(
    (match.overall_score ?? match.final_score) * 100
  );
  const skillPct = Math.round(match.skill_score * 100);
  const proxPct = Math.round(match.proximity_score * 100);
  const relPct = Math.round(match.reliability_score * 100);

  const completionRatePct = Math.round((match.completion_rate ?? volunteer.completion_rate) * 100);
  const tasksCompleted = match.tasks_completed ?? volunteer.tasks_completed ?? 0;
  const avgResponse = match.avg_response_minutes ?? volunteer.avg_response_minutes ?? 10;
  const distanceKm = match.distance;

  const matchedSkills = match.matched_skills || volunteer.skills;
  const missingSkills = match.missing_skills || [];
  const matchReasons = match.match_reasons || [];

  return (
    <div
      className="glass"
      style={{
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: rank === 1 ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
        background: rank === 1 ? "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(17, 24, 39, 0.6))" : undefined,
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              fontSize: "15px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {volunteer.name}
              </h3>
              {rank === 1 && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: 800,
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#fcd34d",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Top Match
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={11} color="#22d3ee" />
                {distanceKm !== null && distanceKm !== undefined
                  ? `${distanceKm} km away`
                  : volunteer.location?.zone
                  ? `${volunteer.location.zone}`
                  : "Distance unavailable"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <UserCheck size={11} color="#22c55e" />
                {volunteer.availability ? "Available" : "Assigned"}
              </span>
            </div>
          </div>
        </div>

        {/* Match Score Badge */}
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "22px", fontWeight: 800, color: "#a5b4fc", lineHeight: 1 }}>
            {overallScorePct}%
          </span>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, margin: "2px 0 0" }}>
            Match Score
          </p>
        </div>
      </div>

      {/* Visual Score Bar */}
      <MatchScoreBar
        skillScore={match.skill_score}
        proximityScore={match.proximity_score}
        reliabilityScore={match.reliability_score}
      />

      {/* Numerical Weight Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.02)",
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Skills (50%)</span>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#a5b4fc", margin: "2px 0 0" }}>
            {skillPct}%
          </p>
        </div>
        <div>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Proximity (30%)</span>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#22d3ee", margin: "2px 0 0" }}>
            {proxPct}%
          </p>
        </div>
        <div>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Reliability (20%)</span>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", margin: "2px 0 0" }}>
            {relPct}%
          </p>
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
          Skills Breakdown
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {matchedSkills.map((skill) => (
            <span
              key={skill}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                background: "rgba(34, 197, 94, 0.12)",
                color: "#4ade80",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <CheckCircle2 size={10} /> {skill}
            </span>
          ))}

          {missingSkills.map((skill) => (
            <span
              key={skill}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                background: "rgba(245, 158, 11, 0.12)",
                color: "#fcd34d",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <AlertTriangle size={10} /> Missing: {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Reliability & History Metrics */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "11px",
          color: "var(--text-muted)",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: "10px",
        }}
      >
        <span>
          <strong style={{ color: "#22c55e" }}>{completionRatePct}%</strong> completion
        </span>
        <span>•</span>
        <span>
          <strong style={{ color: "var(--text-primary)" }}>{tasksCompleted}</strong> tasks done
        </span>
        <span>•</span>
        <span>
          <strong style={{ color: "var(--text-primary)" }}>{avgResponse}m</strong> avg resp
        </span>
      </div>

      {/* Match Reasons */}
      {matchReasons.length > 0 && (
        <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 4px" }}>
            Why This Match?
          </p>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {matchReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Assign Action */}
      <button
        onClick={onAssign}
        disabled={assigning}
        className="btn-primary"
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: "4px",
          opacity: assigning ? 0.7 : 1,
          cursor: assigning ? "not-allowed" : "pointer",
        }}
      >
        {assigning ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Assigning...
          </>
        ) : (
          "Assign Volunteer"
        )}
      </button>
    </div>
  );
}
