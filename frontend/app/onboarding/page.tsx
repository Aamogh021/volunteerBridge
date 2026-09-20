/**
 * Onboarding page — allows new users to choose their role.
 * Only USER and VOLUNTEER are available (NGO_ADMIN must be assigned manually).
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getRoleHomePath } from "@/hooks/useUserProfile";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { HandHeart, Users, ArrowRight, Shield } from "lucide-react";
import type { UserRole } from "@/types";
import { useEffect } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated and hasn't already onboarded
  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      // Check if profile already has a role set
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data?.role) {
        // Already onboarded, redirect to their dashboard
        router.push(getRoleHomePath(data.role as UserRole));
        return;
      }

      setChecking(false);
    }
    check();
  }, [router]);

  const handleSubmit = async () => {
    if (!selected) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      // Resolve default organization UUID
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", "default")
        .maybeSingle();

      // Upsert profile with chosen role
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: session.user.id,
        email: session.user.email || "",
        full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
        role: selected,
        organization_id: org?.id || null,
        avatar_url: session.user.user_metadata?.avatar_url || null,
      });

      if (upsertError) throw upsertError;

      router.push(getRoleHomePath(selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role. Please try again.");
      setLoading(false);
    }
  };

  if (checking) {
    return <FullPageSpinner label="Checking profile..." />;
  }

  const roles: { role: UserRole; label: string; description: string; icon: React.ReactNode; gradient: string }[] = [
    {
      role: "USER",
      label: "Community Member",
      description: "Report needs in your community and track their resolution status.",
      icon: <Users size={32} />,
      gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    },
    {
      role: "VOLUNTEER",
      label: "Volunteer",
      description: "Respond to community needs, get assigned tasks, and make a difference.",
      icon: <HandHeart size={32} />,
      gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    },
  ];

  return (
    <div className="login-bg">
      <div
        className="glass animate-fade-in"
        style={{
          padding: '48px',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 64, height: 64, borderRadius: 16,
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, color: 'white',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
          }}
        >
          VB
        </div>

        <h1 className="gradient-text" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          Welcome to VolunteerBridge
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>
          Choose your role to get started
        </p>

        {/* Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {roles.map(({ role, label, description, icon, gradient }) => {
            const isSelected = selected === role;
            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '20px',
                  borderRadius: '16px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '2px solid rgba(99, 102, 241, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', flexShrink: 0,
                    boxShadow: isSelected ? '0 4px 20px rgba(99, 102, 241, 0.3)' : 'none',
                  }}
                >
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {description}
                  </p>
                </div>
                {/* Check indicator */}
                {isSelected && (
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginLeft: 'auto', flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Admin note */}
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}
        >
          <Shield size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <p style={{ fontSize: '11px', color: '#fbbf24', margin: 0, textAlign: 'left', lineHeight: 1.4 }}>
            NGO Admin accounts are created by organization administrators only.
          </p>
        </div>

        {/* Continue button */}
        <button
          onClick={handleSubmit}
          disabled={!selected || loading}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderRadius: '14px',
            opacity: (!selected || loading) ? 0.5 : 1,
            cursor: (!selected || loading) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? "Setting up..." : "Continue"}
          {!loading && <ArrowRight size={18} />}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '16px', padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
