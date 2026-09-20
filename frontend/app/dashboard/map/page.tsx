/**
 * Crisis Map page — Dark glassmorphism theme with interactive filters & AI Field Briefing.
 */

"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CrisisMap from "@/components/map/CrisisMap";
import AssignmentPanel from "@/components/map/AssignmentPanel";
import { useNeeds } from "@/hooks/useFirestore";
import { generateFieldBriefing } from "@/lib/api";
import type { CommunityNeed } from "@/types";
import {
  Filter,
  Brain,
  RotateCcw,
  Sparkles,
  X,
  AlertTriangle,
  Users,
  ShieldAlert,
} from "lucide-react";

function MapPageContent() {
  const { needs } = useNeeds("default");
  const searchParams = useSearchParams();
  const [selectedNeed, setSelectedNeed] = useState<CommunityNeed | null>(null);

  // Filter States
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "critical" | "moderate" | "low">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const [needTypeFilter, setNeedTypeFilter] = useState<string>("all");

  // Briefing Modal State
  const [briefing, setBriefing] = useState<{
    situation: string;
    your_role: string;
    what_to_expect: string;
    coordinate_with: string;
    safety_note: string;
  } | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  // Parse URL search params if present
  useEffect(() => {
    const rawFilters = searchParams.get("filters");
    if (rawFilters) {
      try {
        const parsed = JSON.parse(rawFilters);
        if (parsed.urgency_min && parsed.urgency_min >= 8) setUrgencyFilter("critical");
        if (parsed.status) setStatusFilter(parsed.status as any);
        if (parsed.need_type) setNeedTypeFilter(parsed.need_type);
      } catch (e) {
        console.error("Failed to parse URL filters", e);
      }
    }
  }, [searchParams]);

  // Extract unique need types dynamically
  const uniqueNeedTypes = useMemo(() => {
    return Array.from(new Set(needs.map((n) => n.need_type).filter(Boolean))).sort();
  }, [needs]);

  // Filter Needs
  const filteredNeeds = useMemo(() => {
    return needs.filter((n) => {
      // Status filter
      if (statusFilter === "unassigned" && n.status !== "unassigned") return false;
      if (statusFilter === "assigned" && n.status === "unassigned") return false;

      // Urgency filter
      if (urgencyFilter === "critical" && n.urgency_score < 8) return false;
      if (urgencyFilter === "moderate" && (n.urgency_score < 5 || n.urgency_score >= 8)) return false;
      if (urgencyFilter === "low" && n.urgency_score >= 5) return false;

      // Need type filter
      if (needTypeFilter !== "all" && n.need_type.toLowerCase() !== needTypeFilter.toLowerCase()) return false;

      return true;
    });
  }, [needs, urgencyFilter, statusFilter, needTypeFilter]);

  const hasActiveFilters = urgencyFilter !== "all" || statusFilter !== "all" || needTypeFilter !== "all";

  const handleResetFilters = () => {
    setUrgencyFilter("all");
    setStatusFilter("all");
    setNeedTypeFilter("all");
  };

  const handleFetchBriefing = async () => {
    setShowBriefingModal(true);
    setBriefingLoading(true);
    setBriefingError(null);
    try {
      const data = await generateFieldBriefing({ org_id: "default" });
      setBriefing(data);
    } catch (err) {
      setBriefingError(err instanceof Error ? err.message : "Failed to load briefing");
    } finally {
      setBriefingLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 64px)',
        margin: '-32px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Filter & Control Overlay */}
      <div
        className="glass-strong"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 10,
          borderRadius: '16px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Need Count & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              {filteredNeeds.length} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>of {needs.length} Needs</span>
            </p>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)' }} />

          {/* Urgency Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
              Urgency:
            </span>
            {(["all", "critical", "moderate", "low"] as const).map((u) => {
              const active = urgencyFilter === u;
              return (
                <button
                  key={u}
                  onClick={() => setUrgencyFilter(u)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: active ? '1px solid #6366f1' : '1px solid transparent',
                    background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: active ? '#a5b4fc' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {u}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
              Status:
            </span>
            {(["all", "unassigned", "assigned"] as const).map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: active ? '1px solid #22d3ee' : '1px solid transparent',
                    background: active ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: active ? '#67e8f9' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Need Type Selector */}
          {uniqueNeedTypes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={needTypeFilter}
                onChange={(e) => setNeedTypeFilter(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(17, 24, 39, 0.8)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Need Types</option>
                {uniqueNeedTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 8px', borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        {/* Right: AI Field Briefing Trigger */}
        <button
          onClick={handleFetchBriefing}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            flexShrink: 0,
          }}
        >
          <Sparkles size={14} color="#a5b4fc" />
          AI Field Briefing
        </button>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <CrisisMap needs={filteredNeeds} onMarkerClick={setSelectedNeed} />
      </div>

      {/* Slide-in Assignment Panel */}
      {selectedNeed && (
        <>
          <div
            onClick={() => setSelectedNeed(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 30,
            }}
          />
          <AssignmentPanel
            need={selectedNeed}
            orgId="default"
            onClose={() => setSelectedNeed(null)}
            onAssigned={() => setSelectedNeed(null)}
          />
        </>
      )}

      {/* AI Field Briefing Modal */}
      {showBriefingModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setShowBriefingModal(false)}
        >
          <div
            className="card-static glass-strong animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Brain size={22} color="#6366f1" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                    AI Field Briefing
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    Real-time operational summary powered by Gemini AI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBriefingModal(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px', borderRadius: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            {briefingLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: '#6366f1' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Analyzing real Supabase operational data with Gemini...
                </p>
              </div>
            ) : briefingError ? (
              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{briefingError}</p>
              </div>
            ) : briefing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Situation */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Current Situation
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {briefing.situation}
                  </p>
                </div>

                {/* Role & Priorities */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(34, 211, 238, 0.08)', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Suggested Role & Priorities
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {briefing.your_role}
                  </p>
                </div>

                {/* Field Conditions & Skill Shortages */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Field Conditions & Skill Gaps
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {briefing.what_to_expect}
                  </p>
                </div>

                {/* Coordination */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Team Coordination
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {briefing.coordinate_with}
                  </p>
                </div>

                {/* Safety Note */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={13} color="#ef4444" /> Critical Safety Protocol
                  </p>
                  <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
                    {briefing.safety_note}
                  </p>
                </div>
              </div>
            ) : null}

            <button
              onClick={() => setShowBriefingModal(false)}
              className="btn-secondary"
              style={{ padding: '10px', fontSize: '13px', borderRadius: '12px' }}
            >
              Close Briefing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0e1a' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: '#6366f1' }} />
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}

