"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { matchVolunteers, assignVolunteer, getMatchExplanation } from "@/lib/api";
import type { CommunityNeed, MatchResult, MatchExplanation } from "@/types";
import VolunteerCard from "@/components/map/VolunteerCard";
import { ArrowLeft, MapPin, Clock, Brain, Sparkles, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

const ORG_ID = "default";

function getUrgencyBadgeStyle(score: number) {
  if (score >= 8) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' };
  if (score >= 5) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.3)' };
  return { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: 'rgba(34, 197, 94, 0.3)' };
}

export default function NeedAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const needId = params.needId as string;

  const [need, setNeed] = useState<CommunityNeed | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  // AI Match Intelligence state
  const [aiExplanation, setAiExplanation] = useState<MatchExplanation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchMatches = async () => {
    setMatchLoading(true);
    try {
      const matchResults = await matchVolunteers(needId, ORG_ID);
      setMatches(matchResults || []);
    } catch (err) {
      console.error("Failed to load matches:", err);
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    const fetchNeed = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from("needs")
          .select("*")
          .eq("id", needId)
          .single();

        if (dbError || !data) {
          setError("Need not found.");
          setLoading(false);
          return;
        }

        const communityNeed: CommunityNeed = {
          id: data.id,
          need_type: data.need_type || "Unknown",
          urgency_score: data.urgency_score || 5,
          required_skills: data.required_skills || [],
          location: {
            lat: data.latitude || 0,
            lng: data.longitude || 0,
            zone: data.zone || "Unknown",
          },
          volunteer_hours_needed: data.volunteer_hours_needed || 0,
          confidence_score: data.confidence_score ?? null,
          raw_text: data.raw_text ?? null,
          status: data.status || "unassigned",
          org_id: ORG_ID,
          created_at: data.created_at ?? null,
        };

        setNeed(communityNeed);
        setLoading(false);

        await fetchMatches();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load need";
        setError(message);
        setLoading(false);
        setMatchLoading(false);
      }
    };

    fetchNeed();
  }, [needId]);

  const handleAssign = async (volunteerId: string) => {
    try {
      setAssigning(volunteerId);
      await assignVolunteer(needId, volunteerId, ORG_ID);
      router.push("/dashboard/assign");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Assignment failed";
      setError(message);
    } finally {
      setAssigning(null);
    }
  };

  const handleFetchAiInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const explanation = await getMatchExplanation(needId, ORG_ID);
      setAiExplanation(explanation);
    } catch (err) {
      setAiError("Could not generate AI insights at this time. Match ranking operates independently.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
        <div className="animate-spin" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: '#6366f1' }} />
      </div>
    );
  }

  if (error || !need) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', fontWeight: 700, color: '#fca5a5', marginBottom: '8px' }}>Error</p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{error || "Need not found"}</p>
        <button
          className="btn-secondary"
          onClick={() => router.push("/dashboard/assign")}
          style={{ padding: '10px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Back to Assignments
        </button>
      </div>
    );
  }

  const urgency = getUrgencyBadgeStyle(need.urgency_score);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <button
        onClick={() => router.push("/dashboard/assign")}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: 'fit-content',
        }}
      >
        <ArrowLeft size={16} /> Back to All Needs
      </button>

      {/* Need details card */}
      <div className="card-static" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}`,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Urgency Score {need.urgency_score}/10
              </span>
              <span style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
              }}>
                Status: {need.status.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {need.need_type}
            </h2>
          </div>
        </div>

        {need.raw_text && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px' }}>
            "{need.raw_text}"
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#6366f1" />
            {need.location.zone}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="#22d3ee" />
            {need.volunteer_hours_needed} hours needed
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {need.required_skills.map((skill) => (
            <span
              key={skill}
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Header & AI Insights Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Volunteer Matches
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Candidates ranked using skills (50%), proximity (30%), and reliability (20%).
          </p>
        </div>

        <button
          onClick={handleFetchAiInsights}
          disabled={aiLoading || matches.length === 0}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            cursor: matches.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: aiLoading || matches.length === 0 ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {aiLoading ? (
            <Sparkles size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {aiLoading ? "Generating AI Insights..." : "✨ AI Match Insights"}
        </button>
      </div>

      {/* AI Insights Skeleton Loader */}
      {aiLoading && (
        <div
          className="glass animate-pulse"
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(17, 24, 39, 0.8))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Brain size={20} color="#6366f1" className="animate-spin" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#a5b4fc' }}>
              Gemini AI is analyzing candidate trade-offs and operational match intelligence...
            </span>
          </div>
          <div style={{ height: '14px', width: '85%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', marginBottom: '10px' }} />
          <div style={{ height: '14px', width: '65%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px' }} />
        </div>
      )}

      {/* AI Insights Panel */}
      {aiExplanation && !aiLoading && (
        <div
          className="glass"
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(17, 24, 39, 0.8))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Brain size={18} color="#6366f1" />
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              AI Match Operational Insights
            </h4>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            {aiExplanation.summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Why Top Candidate */}
            {aiExplanation.why && aiExplanation.why.length > 0 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Key Strengths
                </p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {aiExplanation.why.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trade-offs */}
            {aiExplanation.tradeoffs && aiExplanation.tradeoffs.length > 0 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> Candidate Trade-offs
                </p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {aiExplanation.tradeoffs.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Considerations */}
            {aiExplanation.considerations && aiExplanation.considerations.length > 0 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#fcd34d', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> Operational Considerations
                </p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {aiExplanation.considerations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
            ✨ AI-generated explanation based on current match data
          </p>
        </div>
      )}

      {aiError && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#fca5a5" />
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{aiError}</span>
        </div>
      )}

      {/* Matched Volunteers Grid */}
      <div>
        {matchLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div className="animate-spin" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: '#6366f1' }} />
          </div>
        ) : matches.length === 0 ? (
          <div className="card-static" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <AlertCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No suitable volunteers found
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              All registered volunteers in this organization are currently unavailable, assigned to active tasks, or lack required skills.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={fetchMatches}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Refresh Matches
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {matches.map((match, i) => (
              <VolunteerCard
                key={match.volunteer.id || i}
                match={match}
                rank={i + 1}
                assigning={assigning === match.volunteer.id}
                onAssign={() =>
                  match.volunteer.id && handleAssign(match.volunteer.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

