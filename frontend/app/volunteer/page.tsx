/**
 * Volunteer Dashboard — Overview of available needs and assignment stats.
 */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Star,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface AvailableNeed {
  id: string;
  need_type: string;
  urgency_score: number;
  required_skills: string[];
  location: { lat: number; lng: number; zone: string };
  status: string;
  created_at: string;
}

export default function VolunteerDashboardPage() {
  const { profile } = useUserProfile();
  const [availableNeeds, setAvailableNeeds] = useState<AvailableNeed[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let volunteerId: string | null = null;
        if (session?.user?.id) {
          const { data: vol } = await supabase
            .from("volunteers")
            .select("id")
            .eq("profile_id", session.user.id)
            .maybeSingle();
          if (vol) volunteerId = vol.id;
        }

        // Fetch unassigned needs (available for volunteers)
        const { data: needsData } = await supabase
          .from("needs")
          .select("*")
          .eq("status", "unassigned")
          .order("urgency_score", { ascending: false });

        setAvailableNeeds(needsData || []);

        // Fetch volunteer's assignments
        let assignQuery = supabase.from("assignments").select("*, needs(*)");
        if (volunteerId) {
          assignQuery = assignQuery.eq("volunteer_id", volunteerId);
        }
        const { data: assignmentData } = await assignQuery.order("assigned_at", { ascending: false });

        setMyAssignments(assignmentData || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Realtime subscription
    const channelId = `vol-dashboard-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "needs" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => fetchData());
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeAssignments = myAssignments.filter(a => a.status === "assigned");
  const completedAssignments = myAssignments.filter(a => a.status === "completed");

  const statCards = [
    { label: "Available Needs", value: availableNeeds.length, icon: <Activity size={20} />, color: "#a5b4fc", bg: "rgba(99, 102, 241, 0.1)" },
    { label: "My Active Tasks", value: activeAssignments.length, icon: <ClipboardList size={20} />, color: "#fb923c", bg: "rgba(249, 115, 22, 0.1)" },
    { label: "Completed", value: completedAssignments.length, icon: <CheckCircle2 size={20} />, color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
    { label: "Critical Needs", value: availableNeeds.filter(n => n.urgency_score >= 8).length, icon: <AlertTriangle size={20} />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
          Welcome, {profile?.full_name || "Volunteer"}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
          See available community needs and manage your assignments
        </p>
      </div>

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

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Available Needs */}
        <div className="glass" style={{ borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              🔥 Urgent Needs
            </h2>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
          ) : availableNeeds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <CheckCircle2 size={28} style={{ color: '#22c55e', marginBottom: 8 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No unassigned needs right now</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableNeeds.slice(0, 5).map((need) => (
                <div
                  key={need.id}
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: need.urgency_score >= 8 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 800,
                      color: need.urgency_score >= 8 ? '#ef4444' : '#fbbf24',
                    }}>
                      {need.urgency_score}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {need.need_type}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} /> {need.location?.zone || "Unknown"}
                    </p>
                  </div>
                  {need.required_skills?.length > 0 && (
                    <span style={{
                      fontSize: 10, color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.1)',
                      padding: '3px 8px', borderRadius: 6,
                    }}>
                      {need.required_skills[0]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Assignments */}
        <div className="glass" style={{ borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              📋 My Assignments
            </h2>
            <Link href="/volunteer/assignments" style={{ fontSize: 12, color: '#a5b4fc', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
          ) : myAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <ClipboardList size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No assignments yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myAssignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {assignment.needs?.need_type || "Assignment"}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 8,
                    fontSize: 11, fontWeight: 600,
                    background: assignment.status === "completed" ? 'rgba(34, 197, 94, 0.12)' : 'rgba(249, 115, 22, 0.12)',
                    color: assignment.status === "completed" ? '#22c55e' : '#fb923c',
                  }}>
                    {assignment.status === "completed" ? "Done" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
