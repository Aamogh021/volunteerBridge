"use client";

import ImpactCounters from "@/components/shell/ImpactCounters";
import NeedFeed from "@/components/intake/NeedFeed";
import CrisisReportCard from "@/components/intake/CrisisReport";
import { useNeeds } from "@/hooks/useFirestore";
import { Brain, TrendingUp, Star, AlertTriangle, Lightbulb } from "lucide-react";

export default function DashboardPage() {
  const { needs } = useNeeds("default");
  const activeNeedsLength = needs.filter((n) => n.status === "unassigned").length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        Operations Overview
      </h2>

      <ImpactCounters />

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
        {/* Left card (NeedFeed) */}
        <div className="card-static" style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Live Incoming Needs
            </h3>
            <span className="badge badge-critical">
              {activeNeedsLength}
            </span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="scrollbar-thin">
            <NeedFeed />
          </div>
        </div>

        {/* Right card (CrisisReport) */}
        <div className="card-static" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Brain size={16} color="#6366f1" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              AI Intelligence Report
            </h3>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px' }} className="scrollbar-thin">
            <CrisisReportCard />
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="card-static" style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(34,211,238,0.04))',
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Brain size={20} color="#6366f1" /> AI Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {([
            { Icon: TrendingUp, color: '#ef4444', title: 'Trending Need', text: 'Medical aid requests increased 45% in Dharavi this week' },
            { Icon: Star, color: '#f59e0b', title: 'Top Volunteer', text: 'Priya Sharma: 23 tasks, 96% completion, highest reliability' },
            { Icon: AlertTriangle, color: '#f59e0b', title: 'Skill Gap', text: 'High demand for Construction & Heavy Lifting — 2 unmatched tasks' },
            { Icon: Lightbulb, color: '#22d3ee', title: 'Recommendation', text: 'Pre-position medical volunteers near Dharavi to cut response time 40%' },
          ] as const).map((item, i) => (
            <div key={i} style={{
              padding: '16px', borderRadius: '12px',
              background: 'rgba(17,24,39,0.5)',
              border: '1px solid var(--border-subtle)',
              transition: 'all 0.3s ease',
            }}>
              <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <item.Icon size={14} color={item.color} /> {item.title}
              </p>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
