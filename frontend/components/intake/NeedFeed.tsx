/**
 * NeedFeed — Real-time scrolling feed of incoming community needs.
 * Dark glassmorphism theme.
 */

"use client";

import { useNeeds } from "@/hooks/useFirestore";
import { Brain } from "lucide-react";

function timeAgo(dateString: string | null): string {
  if (!dateString) return "Just now";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function NeedFeed() {
  const { needs, loading } = useNeeds("default");
  
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '60px',
              background: 'rgba(99, 102, 241, 0.05)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          />
        ))}
      </div>
    );
  }

  const activeNeeds = needs.filter(n => n.status === "unassigned");

  if (activeNeeds.length === 0) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px',
        }}
      >
        <Brain size={40} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px' }}>
          No active needs
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {activeNeeds.map((need) => {
        let barColor = "#22c55e";
        let badgeBg = "rgba(34, 197, 94, 0.15)";
        let badgeText = "#86efac";
        let badgeBorder = "rgba(34, 197, 94, 0.3)";
        let badgeLabel = "LOW";

        if (need.urgency_score >= 8) {
          barColor = "#ef4444";
          badgeBg = "rgba(239, 68, 68, 0.15)";
          badgeText = "#fca5a5";
          badgeBorder = "rgba(239, 68, 68, 0.3)";
          badgeLabel = "CRITICAL";
        } else if (need.urgency_score >= 5) {
          barColor = "#f59e0b";
          badgeBg = "rgba(245, 158, 11, 0.15)";
          badgeText = "#fcd34d";
          badgeBorder = "rgba(245, 158, 11, 0.3)";
          badgeLabel = "MODERATE";
        }

        return (
          <div
            key={need.id}
            style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* Left bar */}
            <div
              style={{ width: '4px', alignSelf: 'stretch', backgroundColor: barColor, flexShrink: 0 }}
            />

            {/* Content */}
            <div
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 16px' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
                {need.need_type}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1 }}>
                {need.location.zone}
              </span>
            </div>

            {/* Right */}
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, padding: '12px 16px', gap: '4px' }}
            >
              <span
                style={{
                  fontSize: '10px', fontWeight: 700,
                  padding: '3px 10px', borderRadius: '20px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  backgroundColor: badgeBg, color: badgeText,
                  border: `1px solid ${badgeBorder}`,
                  lineHeight: 1,
                }}
              >
                {badgeLabel}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1 }}>
                {timeAgo(need.created_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
