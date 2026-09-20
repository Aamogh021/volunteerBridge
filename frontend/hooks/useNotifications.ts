/**
 * Hook for managing real-time in-app notifications in VolunteerBridge.
 * Follows Supabase Realtime best practices with RLS security compliance.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { AppNotification } from "@/types";

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  activeToast: AppNotification | null;
  clearToast: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { profile } = useUserProfile();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearToast = useCallback(() => {
    setActiveToast(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  const triggerToast = useCallback((notif: AppNotification) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setActiveToast(notif);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 5000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (profile.role === "NGO_ADMIN" && profile.organization_id) {
        query = query.or(`recipient_id.eq.${profile.id},organization_id.eq.${profile.organization_id}`);
      } else {
        query = query.eq("recipient_id", profile.id);
      }

      const { data, error: fetchErr } = await query;

      if (fetchErr) throw fetchErr;

      const items: AppNotification[] = data || [];
      setNotifications(items);

      const unread = items.filter((n) => !n.read).length;
      setUnreadCount(unread);

      // Track seen IDs
      const ids = new Set<string>();
      items.forEach((item) => ids.add(item.id));
      seenIdsRef.current = ids;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load notifications";
      console.error("[useNotifications] Fetch error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.role, profile?.organization_id]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const { error: updateErr } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", id);

      if (updateErr) {
        console.error("[useNotifications] Mark read error:", updateErr.message);
        // Rollback on failure
        fetchNotifications();
      }
    } catch (err) {
      console.error("[useNotifications] Mark read exception:", err);
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      // Optimistic update
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: now })));
      setUnreadCount(0);

      let updateQuery = supabase
        .from("notifications")
        .update({ read: true, read_at: now })
        .eq("read", false);

      if (profile.role === "NGO_ADMIN" && profile.organization_id) {
        updateQuery = updateQuery.or(`recipient_id.eq.${profile.id},organization_id.eq.${profile.organization_id}`);
      } else {
        updateQuery = updateQuery.eq("recipient_id", profile.id);
      }

      const { error: updateErr } = await updateQuery;
      if (updateErr) {
        console.error("[useNotifications] Mark all read error:", updateErr.message);
        fetchNotifications();
      }
    } catch (err) {
      console.error("[useNotifications] Mark all read exception:", err);
    }
  }, [notifications, profile?.id, profile?.role, profile?.organization_id, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channelName = `realtime-notifications-${profile.id}-${Math.floor(Math.random() * 10000)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          if (!newNotif || !newNotif.id) return;

          // Check if payload is meant for this recipient or org
          const isForUser = newNotif.recipient_id === profile.id;
          const isForOrg =
            profile.role === "NGO_ADMIN" &&
            profile.organization_id &&
            newNotif.organization_id === profile.organization_id;

          if (isForUser || isForOrg) {
            // Deduplicate across strict mode or reconnects
            if (seenIdsRef.current.has(newNotif.id)) return;
            seenIdsRef.current.add(newNotif.id);

            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            setUnreadCount((prev) => prev + 1);
            triggerToast(newNotif);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role, profile?.organization_id, triggerToast]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    activeToast,
    clearToast,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
