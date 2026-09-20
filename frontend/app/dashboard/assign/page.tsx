/**
 * Assign page — Lists needs available for assignment.
 * Dark glassmorphism theme.
 */

"use client";

import { useRouter } from "next/navigation";
import { useNeeds } from "@/hooks/useFirestore";
import { MapPin, Clock, Users, ArrowRight, CheckCircle2 } from "lucide-react";

const ORG_ID = "default";

function getUrgencyBadgeStyle(score: number) {
  if (score >= 8) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' };
  if (score >= 5) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.3)' };
  return { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: 'rgba(34, 197, 94, 0.3)' };
}

export default function AssignPage() {
  const { needs, loading, error } = useNeeds(ORG_ID);
  const router = useRouter();

  const unassignedNeeds = needs.filter((n) => n.status === "unassigned");

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
        <div className="animate-spin" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: '#6366f1' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#fca5a5', margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Assign Volunteers
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Select an unassigned community need to rank and match top volunteers
        </p>
      </div>

      {unassignedNeeds.length === 0 ? (
        <div className="card-static" style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={28} color="#22c55e" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            All Community Needs Assigned
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '400px' }}>
            Upload new survey forms or text descriptions to ingest additional community needs.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {unassignedNeeds.map((need, i) => {
            const urgency = getUrgencyBadgeStyle(need.urgency_score);
            return (
              <div
                key={need.id || i}
                className="card-static"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                      background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      Urgency {need.urgency_score}/10
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      #{need.id ? need.id.substring(0, 6).toUpperCase() : `N-${i+1}`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    {need.need_type}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} color="#6366f1" />
                      {need.location.zone}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} color="#22d3ee" />
                      {need.volunteer_hours_needed}h required
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {need.required_skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
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

                <button
                  className="btn-primary"
                  onClick={() => router.push(`/dashboard/assign/${need.id}`)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    marginTop: '8px',
                  }}
                >
                  Match Volunteers <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

