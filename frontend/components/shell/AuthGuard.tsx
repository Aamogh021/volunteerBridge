/**
 * AuthGuard - Protects routes requiring authentication using Supabase Auth.
 * Redirects to /login if user is not signed in.
 * After authentication, redirects to the correct role-based dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase, syncUserProfile } from "@/lib/supabase";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useUserProfile, getRoleHomePath } from "@/hooks/useUserProfile";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If set, only users with one of these roles can access the guarded content */
  allowedRoles?: UserRole[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { profile, role, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        syncUserProfile(session.user);
      } else {
        setUser(null);
        router.push("/login");
      }
      setAuthLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        syncUserProfile(session.user);
      } else {
        setUser(null);
        router.push("/login");
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Role-based redirect after profile loads
  useEffect(() => {
    if (authLoading || profileLoading || !user) return;

    // If no profile exists yet, redirect to onboarding
    if (!profile && pathname !== "/onboarding") {
      router.push("/onboarding");
      return;
    }

    // If role restrictions are set, check them
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.push(getRoleHomePath(role));
      return;
    }
  }, [authLoading, profileLoading, user, profile, role, allowedRoles, pathname, router]);

  if (authLoading || profileLoading) {
    return <FullPageSpinner label="Authenticating..." />;
  }

  if (!user) {
    return null;
  }

  // Block render if role not allowed
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <FullPageSpinner label="Redirecting..." />;
  }

  return <>{children}</>;
}
