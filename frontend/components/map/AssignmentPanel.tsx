/**
 * AssignmentPanel — Slide-in panel. Dark glassmorphism theme.
 */

"use client";

import { useEffect, useState } from "react";
import { X, MapPin, AlertTriangle } from "lucide-react";
import type { CommunityNeed, MatchResult } from "@/types";
import { matchVolunteers, assignVolunteer } from "@/lib/api";
import VolunteerCard from "./VolunteerCard";

interface AssignmentPanelProps {
  need: CommunityNeed;
  orgId: string;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignmentPanel({ need, orgId, onClose, onAssigned }: AssignmentPanelProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!need.id) { setError("Need ID is missing."); setLoading(false); return; }
      try {
        setLoading(true); setError(null);
        const results = await matchVolunteers(need.id, orgId);
        setMatches(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to find matches");
      } finally { setLoading(false); }
    };
    fetchMatches();
  }, [need.id, orgId]);

  const handleAssign = async (volunteerId: string) => {
    if (!need.id || !volunteerId) return;
    try {
      setAssigning(volunteerId);
      await assignVolunteer(need.id, volunteerId, orgId);
      onAssigned?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally { setAssigning(null); }
  };

  const getUrgencyPill = (score: number) => {
    if (score >= 8) return <span className="badge badge-critical" style={{ fontSize: '10px' }}>CRITICAL</span>;
    if (score >= 5) return <span className="badge badge-high" style={{ fontSize: '10px' }}>MODERATE</span>;
    return <span className="badge badge-low" style={{ fontSize: '10px' }}>LOW</span>;
  };

  return (
    <div
      className="assignment-panel glass-strong"
      style={{
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)', padding: '16px 20px',
      }}>
        <div>
          <div style={{ marginBottom: '8px' }}>{getUrgencyPill(need.urgency_score)}</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.2 }}>{need.need_type}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <MapPin size={12} />
            <span>{need.location.zone}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: '4px', color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 20px' }}>
        <button style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#a5b4fc', borderBottom: '2px solid #6366f1', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', marginRight: '16px', cursor: 'pointer' }}>
          Top Matches
        </button>
        <button style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
          All Volunteers
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'rgba(10, 14, 26, 0.5)' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: '12px', padding: '16px', height: '180px',
              }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)' }} />
                  <div>
                    <div style={{ width: '96px', height: '16px', background: 'rgba(99,102,241,0.1)', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ width: '64px', height: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', textAlign: 'center' }}>
            <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Failed to Load Matches</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Retry</button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div style={{ padding: '48px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>No Matches Found</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No available volunteers meet the criteria.</p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
            {matches.map((match, index) => (
              <VolunteerCard
                key={match.volunteer.id || index}
                match={match}
                rank={index + 1}
                assigning={assigning === match.volunteer.id}
                onAssign={() => match.volunteer.id && handleAssign(match.volunteer.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          disabled={matches.length === 0 || assigning !== null}
          onClick={() => matches[0]?.volunteer?.id && handleAssign(matches[0].volunteer.id)}
          className="btn-primary"
          style={{
            width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700,
            opacity: (matches.length === 0 || assigning !== null) ? 0.5 : 1,
          }}
        >
          Auto-assign Top Match
        </button>
      </div>
    </div>
  );
}
