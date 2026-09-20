/**
 * AI Intelligence page — Dark glassmorphism theme.
 */

"use client";

import { useState } from "react";
import { useNeeds, useCrisisReport } from "@/hooks/useFirestore";
import { matchVolunteers, assignVolunteer } from "@/lib/api";
import { Zap, AlertTriangle, Brain } from "lucide-react";

const ORG_ID = "default";

export default function IntelligencePage() {
  const { needs, loading: needsLoading } = useNeeds(ORG_ID);
  
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [assignResults, setAssignResults] = useState<string[]>([]);

  const unassignedNeeds = needs.filter((n) => n.status === "unassigned");
  const urgentNeeds = unassignedNeeds.filter((n) => n.urgency_score >= 8);

  const handleAutoAssignUrgent = async () => {
    if (urgentNeeds.length === 0) return;

    setAutoAssigning(true);
    setAssignResults([]);
    const results: string[] = [];

    for (const need of urgentNeeds) {
      if (!need.id) continue;

      try {
        const matches = await matchVolunteers(need.id, ORG_ID);
        if (matches.length > 0 && matches[0].volunteer.id) {
          await assignVolunteer(need.id, matches[0].volunteer.id, ORG_ID);
          results.push(
            `✓ ${need.need_type} → ${matches[0].volunteer.name} (${Math.round(matches[0].final_score * 100)}%)`
          );
        } else {
          results.push(`✗ ${need.need_type} — No available volunteers`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed";
        results.push(`✗ ${need.need_type} — ${msg}`);
      }
    }

    setAssignResults(results);
    setAutoAssigning(false);
  };

  const getUrgencyCircle = (score: number) => {
    if (score >= 8) return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5' };
    if (score >= 5) return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fcd34d' };
    return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#86efac' };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Intelligence Insights
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          AI-driven analysis of volunteer deployment and community needs
        </p>
      </div>

      {/* Auto-assign Panel */}
      <div
        className="card-static"
        style={{
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Urgent Needs Auto-Assignment
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Automatically match and assign top volunteers to all needs with urgency ≥ 8
          </p>
        </div>
        <button
          onClick={handleAutoAssignUrgent}
          disabled={urgentNeeds.length === 0 || autoAssigning}
          className="btn-danger"
          style={{
            padding: '10px 20px', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            flexShrink: 0,
            opacity: (urgentNeeds.length === 0 || autoAssigning) ? 0.5 : 1,
          }}
        >
          <Zap size={16} className={autoAssigning ? "animate-pulse" : ""} />
          Auto-assign {urgentNeeds.length} urgent
        </button>
      </div>

      {assignResults.length > 0 && (
        <div className="card-static" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assignResults.map((result, i) => (
            <p
              key={i}
              style={{
                fontSize: '13px', fontWeight: 500, margin: 0,
                color: result.startsWith("✓") ? '#86efac' : '#fca5a5',
              }}
            >
              {result}
            </p>
          ))}
        </div>
      )}

      {/* Intelligence Analytics Table */}
      <div className="card-static" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={16} color="#6366f1" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Intelligence Analytics Table
            </h3>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
            {needs.length} Total Records
          </span>
        </div>

        {needsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div className="animate-spin" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: '#6366f1' }} />
          </div>
        ) : needs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No analytics data available.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <th style={{ padding: '12px 20px' }}>ID</th>
                  <th style={{ padding: '12px 20px' }}>Status</th>
                  <th style={{ padding: '12px 20px' }}>Type</th>
                  <th style={{ padding: '12px 20px' }}>Details</th>
                  <th style={{ padding: '12px 20px' }}>Location</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center' }}>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {needs.map((need, i) => {
                  const idStr = need.id ? need.id.substring(0, 6).toUpperCase() : `N-${i+1000}`;
                  const isAssigned = need.status !== "unassigned";
                  const detailsText = need.raw_text || need.required_skills.join(", ");
                  const truncatedDetails = detailsText.length > 60 ? detailsText.substring(0, 60) + "..." : detailsText;
                  const urgencyStyle = getUrgencyCircle(need.urgency_score);

                  return (
                    <tr
                      key={need.id || i}
                      style={{
                        fontSize: '14px', color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.2s', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-muted)' }}>
                        #{idStr}
                      </td>
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: isAssigned ? '#22c55e' : '#f59e0b',
                            boxShadow: `0 0 6px ${isAssigned ? 'rgba(34,197,94,0.5)' : 'rgba(245,158,11,0.5)'}`,
                          }} />
                          <span style={{ textTransform: 'capitalize' }}>{isAssigned ? 'Assigned' : 'Pending'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                        {need.need_type}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={detailsText}>
                        {truncatedDetails}
                      </td>
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        {need.location.zone}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '50%',
                          border: `1px solid ${urgencyStyle.border}`,
                          backgroundColor: urgencyStyle.bg, color: urgencyStyle.text,
                          fontSize: '12px', fontWeight: 700,
                        }}>
                          {need.urgency_score}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
