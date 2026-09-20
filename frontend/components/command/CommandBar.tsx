/**
 * CommandBar — Cmd+K command palette. Dark glassmorphism theme.
 */

"use client";

import { useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Filter, Zap, CornerDownLeft } from "lucide-react";
import { useCommandBar } from "@/hooks/useCommandBar";
import CommandResultRow, { AiLoadingDots, AiResponseCard } from "./CommandResult";

function getCategoryIcon(icon: string, color: string) {
  const size = 14;
  switch (icon) {
    case "MapPin": return <MapPin size={size} color={color} />;
    case "Filter": return <Filter size={size} color={color} />;
    case "Zap": return <Zap size={size} color={color} />;
    default: return <MapPin size={size} color={color} />;
  }
}

export default function CommandBar() {
  const {
    isOpen, setIsOpen, query, setQuery,
    results, loading, selectedIndex, setSelectedIndex,
    executeCommand, defaultSuggestions, flatSuggestions, aiResponse,
  } = useCommandBar();

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => { inputRef.current?.focus(); });
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = query.trim() ? results : flatSuggestions;
      const count = items.length;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((prev) => (prev + 1) % Math.max(count, 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((prev) => (prev - 1 + Math.max(count, 1)) % Math.max(count, 1)); }
      else if (e.key === "Enter") { e.preventDefault(); if (count > 0 && selectedIndex < count) { executeCommand(items[selectedIndex]); } }
    },
    [query, results, flatSuggestions, selectedIndex, setSelectedIndex, executeCommand]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === overlayRef.current) { setIsOpen(false); } },
    [setIsOpen]
  );

  if (!isOpen) return null;

  const showSuggestions = !query.trim() && !aiResponse;
  const showResults = query.trim() && results.length > 0;

  return (
    <>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          zIndex: 100,
          animation: "cmdFadeIn 150ms ease-out",
        }}
      >
        <div
          onKeyDown={handleKeyDown}
          style={{
            position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
            width: "580px", maxWidth: "calc(100vw - 32px)",
            background: "rgba(26, 32, 53, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)",
            overflow: "hidden",
            animation: "cmdScaleIn 150ms ease-out",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Search Input */}
          <div style={{
            display: "flex", alignItems: "center", height: "56px",
            padding: "0 20px", borderBottom: "1px solid var(--border-subtle)", gap: "12px",
          }}>
            <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: "16px", color: "var(--text-primary)",
                backgroundColor: "transparent",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            />
            <span style={{
              backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#a5b4fc",
              fontSize: "11px", padding: "2px 6px", borderRadius: "6px",
              fontFamily: "monospace", flexShrink: 0,
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}>
              ESC
            </span>
          </div>

          {/* Content Area */}
          <div style={{ maxHeight: "400px", overflowY: "auto", padding: "8px 0" }} className="scrollbar-thin">
            {aiResponse && <AiResponseCard response={aiResponse} />}

            {showSuggestions && (
              <>
                {defaultSuggestions.map((group, gi) => {
                  const offset = defaultSuggestions.slice(0, gi).reduce((s, g) => s + g.items.length, 0);
                  return (
                    <div key={group.category}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 20px 4px", marginTop: gi > 0 ? "4px" : "0",
                      }}>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "22px", height: "22px", borderRadius: "6px",
                          backgroundColor: group.color + "14",
                        }}>
                          {getCategoryIcon(group.icon, group.color)}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {group.category}
                        </span>
                      </div>
                      {group.items.map((item, ii) => {
                        const globalIdx = offset + ii;
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <div
                            key={item.text}
                            onClick={() => executeCommand(item.action)}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "8px 20px", cursor: "pointer",
                              backgroundColor: isSelected ? "rgba(99, 102, 241, 0.1)" : "transparent",
                              transition: "background-color 0.1s ease",
                            }}
                            onMouseEnter={(e) => {
                              setSelectedIndex(globalIdx);
                              if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <span style={{ fontSize: "14px", color: "var(--text-primary)", flex: 1 }}>
                              {item.text}
                            </span>
                            <CornerDownLeft size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}

            {loading && <AiLoadingDots />}

            {showResults && !loading &&
              results.map((action, i) => (
                <CommandResultRow
                  key={i}
                  action={action}
                  isSelected={i === selectedIndex}
                  onExecute={() => executeCommand(action)}
                />
              ))}

            {query.trim() && !loading && results.length === 0 && !aiResponse && (
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                  No commands found. Try asking in natural language.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            height: "36px", padding: "0 16px",
            borderTop: "1px solid var(--border-subtle)",
          }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>↑↓ navigate</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>·</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>↵ select</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>·</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>esc close</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "13px", color: "#a5b4fc" }}>✦</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cmdFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmdScaleIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </>
  );
}
