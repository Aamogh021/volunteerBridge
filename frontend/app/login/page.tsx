/**
 * Login page with Google Sign-In using Supabase Authentication.
 * Dark glassmorphism theme.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (authError) {
        throw authError;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div
        className="glass animate-fade-in"
        style={{
          padding: '48px',
          borderRadius: '24px',
          maxWidth: '420px',
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

        <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          VolunteerBridge
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>
          NGO Coordinator Dashboard<br />AI-Powered Crisis Management
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', textAlign: 'left' }}>
          {[
            "AI-powered survey extraction",
            "Smart volunteer-to-need matching",
            "Real-time crisis intelligence",
            "Women safety buddy system",
            "Disaster prediction & response",
          ].map((feature) => (
            <div
              key={feature}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', flexShrink: 0 }} />
              {feature}
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
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
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
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

        {/* Footer */}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Powered by Supabase Auth • Secured with Google Cloud
        </p>
      </div>
    </div>
  );
}
