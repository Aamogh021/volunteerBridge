/**
 * My Requests — Displays all community needs submitted, with status tracking.
 */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ArrowLeft,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface NeedItem {
  id: string;
  need_type: string;
  urgency_score: number;
  required_skills: string[];
  location: { lat: number; lng: number; zone: string };
  status: string;
  created_at: string;
  raw_text: string | null;
}

export default function MyRequestsPage() {
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchNeeds() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let query = supabase.from("needs").select("*");
        if (session?.user?.id) {
          query = query.or(`reported_by.eq.${session.user.id},reported_by.is.null`);
        }
        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        setNeeds(data || []);
      } catch (err) {
        console.error("Failed to fetch needs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNeeds();

    // Realtime subscription for status updates
    const channelId = `user-needs-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "needs" }, () => {
        fetchNeeds();
      });
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredNeeds = filter === "all"
    ? needs
    : needs.filter(n => n.status === filter);

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    unassigned: { icon: <Clock size={14} />, color: "#fbbf24", bg: "rgba(234, 179, 8, 0.12)", label: "Unassigned" },
    assigned: { icon: <AlertTriangle size={14} />, color: "#fb923c", bg: "rgba(249, 115, 22, 0.12)", label: "Assigned" },
    in_progress: { icon: <AlertTriangle size={14} />, color: "#60a5fa", bg: "rgba(59, 130, 246, 0.12)", label: "In Progress" },
    completed: { icon: <CheckCircle2 size={14} />, color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)", label: "Completed" },
    cancelled: { icon: <Clock size={14} />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", label: "Cancelled" },
  };

  const filterTabs = [
    { key: "all", label: "All", count: needs.length },
    { key: "unassigned", label: "Unassigned", count: needs.filter(n => n.status === "unassigned").length },
    { key: "assigned", label: "Assigned", count: needs.filter(n => n.status === "assigned").length },
    { key: "in_progress", label: "In Progress", count: needs.filter(n => n.status === "in_progress").length },
    { key: "completed", label: "Completed", count: needs.filter(n => n.status === "completed").length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Back link */}
      <Link
        href="/user"
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          My Requests
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Track the status of all your submitted community needs
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 16px', borderRadius: 10,
              background: filter === tab.key ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: filter === tab.key ? '#a5b4fc' : 'var(--text-muted)',
              border: filter === tab.key ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
            <span style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px', borderRadius: 6,
              fontSize: 11,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Needs List */}
      {loading ? (
        <div className="glass" style={{ padding: 40, borderRadius: 16, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading requests...</p>
        </div>
      ) : filteredNeeds.length === 0 ? (
        <div className="glass" style={{ padding: 60, borderRadius: 16, textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
            {filter === "all" ? "No requests found" : `No ${filter} requests`}
          </p>
          <Link href="/user/report" style={{ fontSize: 13, color: '#a5b4fc', textDecoration: 'none' }}>
            Report your first need →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredNeeds.map((need) => {
            const sc = statusConfig[need.status] || statusConfig.unassigned;
            return (
              <div
                key={need.id}
                className="glass"
                style={{
                  padding: '20px 24px', borderRadius: 16,
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Urgency indicator */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: need.urgency_score >= 8 ? 'rgba(239, 68, 68, 0.12)' :
                    need.urgency_score >= 5 ? 'rgba(234, 179, 8, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 16, fontWeight: 800,
                    color: need.urgency_score >= 8 ? '#ef4444' :
                      need.urgency_score >= 5 ? '#fbbf24' : '#22c55e',
                  }}>
                    {need.urgency_score}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {need.need_type || "Community Need"}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} /> {need.location?.zone || "Unknown"}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {need.created_at ? new Date(need.created_at).toLocaleDateString() : ""}
                    </span>
                    {need.required_skills?.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Skills: {need.required_skills.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: sc.bg, color: sc.color,
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  flexShrink: 0,
                }}>
                  {sc.icon}
                  {sc.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
