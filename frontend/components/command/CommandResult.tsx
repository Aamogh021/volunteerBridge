/**
 * CommandResult — Dark glassmorphism theme.
 */

"use client";

import { CheckCircle, ArrowRight, Brain, Sparkles } from "lucide-react";
import type { CommandAction } from "@/lib/commandParser";

interface CommandResultProps {
  action: CommandAction;
  isSelected: boolean;
  onExecute: () => void;
}

function getBadgeLabel(type: string): string {
  switch (type) {
    case "navigate": return "NAV";
    case "filter_map": return "FILTER";
    case "show_volunteers": return "SEARCH";
    case "assign": return "ACTION";
    case "generate_report": return "AI";
    case "show_stats": return "STATS";
    case "ai_response": return "AI";
    default: return "CMD";
  }
}

function getBadgeColor(type: string): { bg: string; text: string; border: string } {
  switch (type) {
    case "navigate": return { bg: "rgba(99, 102, 241, 0.15)", text: "#a5b4fc", border: "rgba(99, 102, 241, 0.3)" };
    case "filter_map": return { bg: "rgba(34, 197, 94, 0.15)", text: "#86efac", border: "rgba(34, 197, 94, 0.3)" };
    case "show_volunteers": return { bg: "rgba(34, 211, 238, 0.15)", text: "#67e8f9", border: "rgba(34, 211, 238, 0.3)" };
    case "assign": return { bg: "rgba(245, 158, 11, 0.15)", text: "#fcd34d", border: "rgba(245, 158, 11, 0.3)" };
    case "generate_report": return { bg: "rgba(139, 92, 246, 0.15)", text: "#c4b5fd", border: "rgba(139, 92, 246, 0.3)" };
    case "show_stats": return { bg: "rgba(99, 102, 241, 0.15)", text: "#a5b4fc", border: "rgba(99, 102, 241, 0.3)" };
    case "ai_response": return { bg: "rgba(139, 92, 246, 0.15)", text: "#c4b5fd", border: "rgba(139, 92, 246, 0.3)" };
    default: return { bg: "rgba(99, 102, 241, 0.1)", text: "var(--text-muted)", border: "rgba(99, 102, 241, 0.2)" };
  }
}

function getIcon(type: string) {
  switch (type) {
    case "navigate": return <ArrowRight size={16} color="#a5b4fc" />;
    case "ai_response": return <Brain size={16} color="#c4b5fd" />;
    default: return <CheckCircle size={16} color="#86efac" />;
  }
}

function getAccentColor(type: string): string {
  switch (type) {
    case "navigate": return "#6366f1";
    case "ai_response": return "#8b5cf6";
    default: return "#22c55e";
  }
}

export default function CommandResult({ action, isSelected, onExecute }: CommandResultProps) {
  const badge = getBadgeColor(action.type);

  return (
    <div
      onClick={onExecute}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 16px", cursor: "pointer",
        backgroundColor: isSelected ? "rgba(99, 102, 241, 0.1)" : "transparent",
        borderLeft: `3px solid ${isSelected ? getAccentColor(action.type) : "transparent"}`,
        transition: "all 0.1s ease",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.05)"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px", borderRadius: "8px",
        backgroundColor: isSelected ? getAccentColor(action.type) + "20" : "rgba(99, 102, 241, 0.05)",
        flexShrink: 0,
      }}>
        {getIcon(action.type)}
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {action.label}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>
          {action.type === "navigate" ? `→ ${(action as { path: string }).path}` :
           action.type === "ai_response" ? "AI-generated response" :
           "Press Enter to execute"}
        </div>
      </div>

      <span style={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
        padding: "2px 8px", borderRadius: "999px",
        backgroundColor: badge.bg, color: badge.text,
        border: `1px solid ${badge.border}`,
        flexShrink: 0,
      }}>
        {getBadgeLabel(action.type)}
      </span>

      <span style={{ fontSize: "14px", color: "var(--text-muted)", flexShrink: 0 }}>↵</span>
    </div>
  );
}

export function AiLoadingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
      <Sparkles size={16} color="#8b5cf6" />
      <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>
        AI is thinking
      </span>
      <div style={{ display: "flex", gap: "4px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "5px", height: "5px", borderRadius: "50%",
              backgroundColor: "#8b5cf6",
              animation: `cmdPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes cmdPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export function AiResponseCard({ response }: { response: string }) {
  return (
    <div style={{
      margin: "8px 16px", padding: "16px",
      background: "rgba(139, 92, 246, 0.05)",
      border: "1px solid rgba(139, 92, 246, 0.2)",
      borderRadius: "12px",
      borderLeft: "3px solid #8b5cf6",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <Brain size={14} color="#c4b5fd" />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Gemini AI Response
        </span>
      </div>
      <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>{response}</p>
    </div>
  );
}
