/**
 * Real-time data hooks powered by Supabase Realtime and FastAPI backend.
 * Preserves exact hook contracts for dashboard components.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CommunityNeed, Volunteer, Assignment, CrisisReport } from "@/types";
import { getNeeds, getVolunteers, getCrisisReport } from "@/lib/api";

export function useNeeds(orgId: string): {
  needs: CommunityNeed[];
  loading: boolean;
  error: string | null;
} {
  const [needs, setNeeds] = useState<CommunityNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNeeds = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getNeeds(orgId);
      setNeeds(data || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load needs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchNeeds();

    const channelId = `public:needs-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "needs" },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const newNeed = payload.new as CommunityNeed;
            if (!orgId || newNeed.org_id === orgId) {
              setNeeds((prev) => [newNeed, ...prev.filter((n) => n.id !== newNeed.id)]);
            }
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as CommunityNeed;
            setNeeds((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
          } else if (payload.eventType === "DELETE" && payload.old) {
            const oldId = (payload.old as any).id;
            setNeeds((prev) => prev.filter((n) => n.id !== oldId));
          } else {
            fetchNeeds();
          }
        }
      );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        fetchNeeds();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, fetchNeeds]);

  return { needs, loading, error };
}

export function useVolunteers(orgId: string): {
  volunteers: Volunteer[];
  loading: boolean;
  error: string | null;
} {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVolunteers = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getVolunteers(orgId);
      setVolunteers(data || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load volunteers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchVolunteers();

    const channelId = `public:volunteers-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "volunteers" },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const newVol = payload.new as Volunteer;
            setVolunteers((prev) => [newVol, ...prev.filter((v) => v.id !== newVol.id)]);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as Volunteer;
            setVolunteers((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));
          } else if (payload.eventType === "DELETE" && payload.old) {
            const oldId = (payload.old as any).id;
            setVolunteers((prev) => prev.filter((v) => v.id !== oldId));
          } else {
            fetchVolunteers();
          }
        }
      );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        fetchVolunteers();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, fetchVolunteers]);

  return { volunteers, loading, error };
}

export function useAssignments(orgId: string): {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
} {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    try {
      let query = supabase.from("assignments").select("*");
      if (orgId) {
        query = query.or(`org_id.eq.${orgId},organization_id.eq.${orgId}`);
      }
      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      const items: Assignment[] = (data || []).map((row) => ({
        id: row.id,
        need_id: row.need_id,
        volunteer_id: row.volunteer_id,
        assigned_at: row.assigned_at,
        status: row.status || "assigned",
        notification_sent: row.notification_sent ?? false,
      }));
      setAssignments(items);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load assignments";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAssignments();

    const channelId = `public:assignments-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const row = payload.new as any;
            const item: Assignment = {
              id: row.id,
              need_id: row.need_id,
              volunteer_id: row.volunteer_id,
              assigned_at: row.assigned_at,
              status: row.status || "assigned",
              notification_sent: row.notification_sent ?? false,
            };
            setAssignments((prev) => [item, ...prev.filter((a) => a.id !== item.id)]);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const row = payload.new as any;
            setAssignments((prev) =>
              prev.map((a) => (a.id === row.id ? { ...a, status: row.status || a.status } : a))
            );
          } else {
            fetchAssignments();
          }
        }
      );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        fetchAssignments();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, fetchAssignments]);

  return { assignments, loading, error };
}

export function useCrisisReport(orgId: string): {
  report: CrisisReport | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [report, setReport] = useState<CrisisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getCrisisReport(orgId);
      setReport(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load crisis report";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refresh: fetchReport };
}
