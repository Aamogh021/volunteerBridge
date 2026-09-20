/**
 * useUserProfile — Fetches and caches the authenticated user's profile from Supabase.
 * Returns the user's role, profile data, and loading state.
 * This is the single source of truth for role-based routing decisions.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { UserProfile, UserRole } from "@/types";

interface UseUserProfileReturn {
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, organization_id, avatar_url, created_at")
        .eq("id", session.user.id)
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      if (data) {
        setProfile({
          id: data.id,
          email: data.email || "",
          full_name: data.full_name || "",
          role: data.role as UserRole,
          organization_id: data.organization_id,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
        });
      } else {
        // Profile doesn't exist yet — user needs onboarding
        setProfile(null);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch user profile";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Re-fetch on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return {
    profile,
    role: profile?.role ?? null,
    loading,
    error,
    refresh: fetchProfile,
  };
}

/**
 * Helper to get the role-based home path for a given role.
 */
export function getRoleHomePath(role: UserRole | null): string {
  switch (role) {
    case "NGO_ADMIN":
      return "/dashboard";
    case "VOLUNTEER":
      return "/volunteer";
    case "USER":
      return "/user";
    default:
      return "/onboarding";
  }
}
