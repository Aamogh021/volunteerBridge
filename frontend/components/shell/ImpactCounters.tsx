/**
 * ImpactCounters — Animated metric cards showing live platform stats.
 * Dark glassmorphism theme.
 */

"use client";

import { AlertCircle, Zap, CheckCircle2, Star } from "lucide-react";
import { useNeeds } from "@/hooks/useFirestore";

export default function ImpactCounters() {
  const { needs, loading } = useNeeds("default");

  const activeNeedsCount = needs.filter(n => n.status === "unassigned").length;
  const deployedCount = needs.filter(n => n.status === "assigned" || n.status === "completed").length;
  const avgMatchTime = "2.3";

  const stats = [
    {
      label: 'Active Needs',
      value: loading ? '—' : String(activeNeedsCount),
      change: '+23%',
      color: '#ef4444',
      Icon: AlertCircle,
    },
    {
      label: 'Avg Match Time',
      value: loading ? '—' : `${avgMatchTime}m`,
      change: '-68%',
      color: '#22d3ee',
      Icon: Zap,
    },
    {
      label: 'Volunteers Deployed',
      value: loading ? '—' : String(deployedCount),
      change: '+15%',
      color: '#22c55e',
      Icon: CheckCircle2,
    },
    {
      label: 'Impact Score',
      value: '4.8',
      change: '+42%',
      color: '#f59e0b',
      Icon: Star,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {stats.map((s, i) => (
        <div
          key={i}
          className="card"
          style={{
            padding: '24px',
            cursor: 'default',
          }}
        >
          <div style={{ marginBottom: '8px' }}><s.Icon size={22} color={s.color} /></div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
            {s.label}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="stat-number" style={{ color: s.color }}>
              {s.value}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: s.change.startsWith('+') ? '#22c55e' : '#22d3ee',
            }}>
              {s.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
