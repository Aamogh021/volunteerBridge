/**
 * Report a Need — Allows community members to submit needs via text or file upload.
 * Uses the existing /ingest endpoint for AI-powered extraction.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ingestSurvey } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import {
  Send,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function ReportNeedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "file">("text");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (mode === "text" && !textContent.trim()) return;
    if (mode === "file" && !file) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("org_id", "default");
      if (session?.user?.id) {
        formData.append("reported_by", session.user.id);
      }

      if (mode === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("text_content", textContent);
      }

      const response = await ingestSurvey(formData);
      setResult(response);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success && result) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="glass" style={{ padding: 40, borderRadius: 24, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(34, 197, 94, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle2 size={32} style={{ color: '#22c55e' }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Request Submitted
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Your request has been sent to the response team.
          </p>

          {/* Extracted Info */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 14,
            padding: 20,
            textAlign: 'left',
            marginBottom: 24,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={16} style={{ color: '#a5b4fc' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Extraction
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Type</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                  {result.need?.need_type || "N/A"}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Urgency Score</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', margin: '2px 0 0' }}>
                  {result.need?.urgency_score || result.confidence_score || "N/A"}/10
                </p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', margin: '2px 0 0' }}>
                  {result.confidence_score ? `${(result.confidence_score * 100).toFixed(0)}%` : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                setSuccess(false);
                setResult(null);
                setTextContent("");
                setFile(null);
              }}
              className="btn-primary"
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Send size={16} /> Report Another
            </button>
            <Link
              href="/user/requests"
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <FileText size={16} /> View Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Back link */}
      <Link
        href="/user"
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="glass" style={{ padding: 36, borderRadius: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Report a Community Need
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
          Describe the need in your own words. Our AI will extract the details, categorize it, and route it to the right volunteers.
        </p>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(["text", "file"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '8px 18px', borderRadius: 10,
                background: mode === m ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: mode === m ? '#a5b4fc' : 'var(--text-muted)',
                border: mode === m ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              {m === "text" ? <FileText size={14} /> : <Upload size={14} />}
              {m === "text" ? "Write Description" : "Upload Photo"}
            </button>
          ))}
        </div>

        {/* Text Input */}
        {mode === "text" && (
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Example: There is flooding on Main Street near the school. Several families need food, clean water, and temporary shelter. The situation is urgent as water levels are rising..."
            style={{
              width: '100%', minHeight: 160, padding: 16,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: 14, lineHeight: 1.6,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        )}

        {/* File Input */}
        {mode === "file" && (
          <label
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 160, borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px dashed rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            {file ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={28} style={{ color: '#22c55e', marginBottom: 8 }} />
                <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Click to change file
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
                  Drop or click to upload
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Supports photos of handwritten surveys
                </p>
              </div>
            )}
          </label>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || (mode === "text" && !textContent.trim()) || (mode === "file" && !file)}
          className="btn-primary"
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            marginTop: 24, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <Sparkles size={16} className="animate-spin" /> AI Processing...
            </>
          ) : (
            <>
              <Send size={16} /> Submit Report
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={16} style={{ color: '#fca5a5', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
