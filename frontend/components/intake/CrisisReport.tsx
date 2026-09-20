/**
 * CrisisReport — Operations briefing card with AI-generated insights.
 * Dark glassmorphism theme.
 */

"use client";

import { useState, useEffect } from "react";
import type { CrisisReport as CrisisReportType } from "@/types";
import {
  AlertTriangle,
  MapPin,
  RefreshCw,
  Brain,
} from "lucide-react";

export default function CrisisReportCard() {
  const [report, setReport] = useState<CrisisReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/crisis-report/default");
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReport();
  };

  if (loading && !report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', marginBottom: '16px' }} />
        <div style={{ height: '16px', width: '192px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ height: '12px', width: '128px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px' }} />
      </div>
    );
  }

  if (!report || (report.total_needs && report.total_needs < 3)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '12px' }}>
        <Brain size={48} color="var(--text-muted)" />
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
          Upload 3+ surveys to generate report
        </p>
      </div>
    );
  }

  const generatedDate = new Date(report.generated_at);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - generatedDate.getTime()) / 60000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Zone */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MapPin size={16} color="#6366f1" />
        <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {report.zone}
        </p>
      </div>

      {/* Stats Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <span className="badge badge-active">
          {report.total_needs} Total
        </span>
        <span className="badge badge-critical">
          {report.critical_needs} Critical
        </span>
      </div>

      {/* Skill gaps */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Skill Gaps
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {report.skill_gaps.map((gap) => (
            <span
              key={gap}
              className="badge badge-critical"
              style={{ fontSize: '11px', padding: '3px 10px' }}
            >
              {gap}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended actions */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Recommended Actions
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {report.recommended_actions.map((action, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{
                width: '20px', height: '20px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontSize: '11px', fontWeight: 700,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Escalation prediction */}
      <div className="intel-warning" style={{ borderRadius: '12px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <AlertTriangle size={14} color="#f59e0b" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fcd34d' }}>Predicted Escalation</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
          {report.predicted_escalation}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '16px', paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          Generated {diffMinutes === 0 ? "just now" : `${diffMinutes} mins ago`}
        </p>
        <button
          onClick={handleRefresh}
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}
