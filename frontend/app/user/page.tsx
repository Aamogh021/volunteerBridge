/**
 * USER Dashboard — Overview of the community member's submitted needs.
 */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface NeedSummary {
  total: number;
  unassigned: number;
  assigned: number;
  completed: number;
}

export default function UserDashboardPage() {
  const { profile } = useUserProfile();
  const [summary, setSummary] = useState<NeedSummary>({
    total: 0, unassigned: 0, assigned: 0, completed: 0,
  });
  const [recentNeeds, setRecentNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyNeeds() {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .from("needs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const needs = data || [];
        setSummary({
          total: needs.length,
          unassigned: needs.filter(n => n.status === "unassigned").length,
          assigned: needs.filter(n => n.status === "assigned").length,
          completed: needs.filter(n => n.status === "completed").length,
        });
        setRecentNeeds(needs.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch needs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyNeeds();
  }, [profile]);

  const statCards = [
    { label: "Total Requests", value: summary.total, icon: <FileText size={20} />, color: "#a5b4fc", bg: "rgba(99, 102, 241, 0.1)" },
    { label: "Pending", value: summary.unassigned, icon: <Clock size={20} />, color: "#fbbf24", bg: "rgba(234, 179, 8, 0.1)" },
    { label: "In Progress", value: summary.assigned, icon: <AlertTriangle size={20} />, color: "#fb923c", bg: "rgba(249, 115, 22, 0.1)" },
    { label: "Resolved", value: summary.completed, icon: <CheckCircle2 size={20} />, color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      unassigned: { bg: "rgba(234, 179, 8, 0.15)", color: "#fbbf24" },
      assigned: { bg: "rgba(249, 115, 22, 0.15)", color: "#fb923c" },
      completed: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
    };
    const s = styles[status] || styles.unassigned;
    return (
      <span style={{
        padding: '4px 10px', borderRadius: 8,
        background: s.bg, color: s.color,
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
          Welcome, {profile?.full_name || "Community Member"}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
          Track your community needs and report new ones
        </p>
      </div>

      {/* Quick Action */}
      <Link
        href="/user/report"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 16, marginBottom: 28,
          textDecoration: 'none', cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Send size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Report a New Need
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Describe what your community needs — AI will extract and prioritize it
            </p>
          </div>
        </div>
        <ArrowRight size={20} style={{ color: '#a5b4fc' }} />
      </Link>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            className="glass"
            style={{ padding: '20px', borderRadius: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color,
              }}>
                {card.icon}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                {card.label}
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: card.color, margin: 0 }}>
              {loading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="glass" style={{ borderRadius: 16, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Recent Requests
          </h2>
          <Link href="/user/requests" style={{ fontSize: 13, color: '#a5b4fc', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
        ) : recentNeeds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No requests yet</p>
            <Link href="/user/report" style={{ fontSize: 13, color: '#a5b4fc', textDecoration: 'none' }}>
              Report your first need →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentNeeds.map((need) => (
              <div
                key={need.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {need.need_type || "Community Need"}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Urgency: {need.urgency_score}/10 • {need.location?.zone || "Unknown zone"}
                  </p>
                </div>
                {getStatusBadge(need.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
