/**
 * Volunteer Assignments — View and manage assigned tasks.
 * Volunteers can mark tasks as completed.
 */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { updateAssignmentStatus } from "@/lib/api";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Play,
} from "lucide-react";
import Link from "next/link";

interface AssignmentItem {
  id: string;
  need_id: string;
  volunteer_id: string;
  assigned_at: string;
  status: string;
  needs: {
    need_type: string;
    urgency_score: number;
    location: { lat: number; lng: number; zone: string };
    required_skills: string[];
    raw_text: string | null;
  } | null;
}

export default function VolunteerAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();

    const channelId = `vol-assignments-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => fetchAssignments())
      .on("postgres_changes", { event: "*", schema: "public", table: "needs" }, () => fetchAssignments());
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchAssignments() {
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

      let query = supabase.from("assignments").select("*, needs(*)");
      if (volunteerId) {
        query = query.eq("volunteer_id", volunteerId);
      }

      const { data, error } = await query.order("assigned_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(assignmentId: string, needId: string, nextStatus: "in_progress" | "completed") {
    setUpdating(assignmentId);
    setToastMessage(null);
    try {
      await updateAssignmentStatus(assignmentId, nextStatus);
      await fetchAssignments();
      const statusText = nextStatus === "in_progress" ? "In Progress" : "Completed";
      setToastMessage(`Task status successfully updated to '${statusText}'. NGO Admin notified.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error("Failed to update task status:", err);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === "all"
    ? assignments
    : assignments.filter(a => a.status === filter);

  const filterTabs = [
    { key: "all", label: "All", count: assignments.length },
    { key: "assigned", label: "Assigned", count: assignments.filter(a => a.status === "assigned").length },
    { key: "in_progress", label: "In Progress", count: assignments.filter(a => a.status === "in_progress").length },
    { key: "completed", label: "Completed", count: assignments.filter(a => a.status === "completed").length },
  ];

  return (
    <div className="animate-fade-in">
      <Link
        href="/volunteer"
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          My Assignments
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage your assigned tasks and update progress in real time
        </p>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#86efac',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
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
              padding: '2px 6px', borderRadius: 6, fontSize: 11,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="glass" style={{ padding: 40, borderRadius: 16, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading assignments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding: 60, borderRadius: 16, textAlign: 'center' }}>
          <ClipboardList size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 600 }}>
            {filter === "all" ? "No assignments yet" : `No ${filter} assignments`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((assignment) => (
            <div
              key={assignment.id}
              className="glass"
              style={{
                padding: '24px', borderRadius: 16,
                borderLeft: `3px solid ${
                  assignment.status === "completed" ? '#22c55e' :
                  assignment.status === "in_progress" ? '#60a5fa' : '#fb923c'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {assignment.needs?.need_type || "Assignment"}
                    </h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: 8,
                      fontSize: 11, fontWeight: 600,
                      background: assignment.status === "completed" ? 'rgba(34, 197, 94, 0.12)' :
                        assignment.status === "in_progress" ? 'rgba(59, 130, 246, 0.12)' : 'rgba(249, 115, 22, 0.12)',
                      color: assignment.status === "completed" ? '#22c55e' :
                        assignment.status === "in_progress" ? '#60a5fa' : '#fb923c',
                    }}>
                      {assignment.status === "completed" ? "✓ Completed" :
                       assignment.status === "in_progress" ? "● In Progress" : "● Assigned"}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {assignment.needs?.location?.zone && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {assignment.needs.location.zone}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(assignment.assigned_at).toLocaleDateString()}
                    </span>
                    {assignment.needs?.urgency_score != null && (
                      <span style={{
                        fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                        color: assignment.needs.urgency_score >= 8 ? '#ef4444' : '#fbbf24',
                      }}>
                        <AlertTriangle size={12} /> Urgency: {assignment.needs.urgency_score}/10
                      </span>
                    )}
                  </div>

                  {assignment.needs?.required_skills && assignment.needs.required_skills.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {assignment.needs.required_skills.map((skill: string) => (
                        <span
                          key={skill}
                          style={{
                            padding: '3px 10px', borderRadius: 6,
                            fontSize: 11, background: 'rgba(99, 102, 241, 0.1)',
                            color: '#a5b4fc',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workflow Buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {assignment.status === "assigned" && (
                    <button
                      onClick={() => handleStatusChange(assignment.id, assignment.need_id, "in_progress")}
                      disabled={updating === assignment.id}
                      style={{
                        padding: '10px 18px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: updating === assignment.id ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {updating === assignment.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Starting...</>
                      ) : (
                        <><Play size={14} /> Accept / Start Task</>
                      )}
                    </button>
                  )}

                  {(assignment.status === "assigned" || assignment.status === "in_progress") && (
                    <button
                      onClick={() => handleStatusChange(assignment.id, assignment.need_id, "completed")}
                      disabled={updating === assignment.id}
                      style={{
                        padding: '10px 18px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: updating === assignment.id ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      {updating === assignment.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Completing...</>
                      ) : (
                        <><CheckCircle2 size={14} /> Mark Completed</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
