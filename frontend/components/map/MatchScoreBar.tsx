/**
 * MatchScoreBar — Dark glassmorphism theme.
 */

"use client";

interface MatchScoreBarGroupProps {
  skillScore: number;
  proximityScore: number;
  reliabilityScore: number;
}

export default function MatchScoreBar({ skillScore, proximityScore, reliabilityScore }: MatchScoreBarGroupProps) {
  const total = skillScore + proximityScore + reliabilityScore;
  const skillPct = total > 0 ? (skillScore / total) * 100 : 0;
  const proxPct = total > 0 ? (proximityScore / total) * 100 : 0;
  const relPct = total > 0 ? (reliabilityScore / total) * 100 : 0;

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Match Breakdown
        </span>
      </div>
      <div style={{
        display: 'flex', height: '6px', borderRadius: '999px',
        overflow: 'hidden', background: 'rgba(99, 102, 241, 0.1)',
      }}>
        <div style={{ width: `${skillPct}%`, background: '#6366f1' }} title={`Skill: ${Math.round(skillPct)}%`} />
        <div style={{ width: `${proxPct}%`, background: '#22d3ee' }} title={`Proximity: ${Math.round(proxPct)}%`} />
        <div style={{ width: `${relPct}%`, background: '#f59e0b' }} title={`Reliability: ${Math.round(relPct)}%`} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {[
          { color: '#6366f1', label: 'Skill' },
          { color: '#22d3ee', label: 'Prox' },
          { color: '#f59e0b', label: 'Rel' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
