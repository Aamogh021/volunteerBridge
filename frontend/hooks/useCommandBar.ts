/**
 * useCommandBar — Global keyboard shortcut handler and command execution hook.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseCommand, getDefaultSuggestions, CommandAction } from "@/lib/commandParser";

export function useCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const defaultSuggestions = getDefaultSuggestions();

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [isOpen]);

  // Reset state when opening / closing
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setLoading(false);
      setAiResponse(null);
    }
  }, [isOpen]);

  // Debounced query parsing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      setLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setAiResponse(null);
      try {
        const actions = await parseCommand(query);
        setResults(actions);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Execute a command action
  const executeCommand = useCallback(
    (action: CommandAction) => {
      switch (action.type) {
        case "navigate":
          router.push(action.path);
          setIsOpen(false);
          break;
        case "filter_map":
          router.push(`/dashboard/map?filters=${encodeURIComponent(JSON.stringify(action.filters))}`);
          setIsOpen(false);
          break;
        case "show_volunteers":
          router.push(`/dashboard/map?volunteers=${encodeURIComponent(JSON.stringify(action.filters))}`);
          setIsOpen(false);
          break;
        case "generate_report":
          router.push("/dashboard/intelligence");
          setIsOpen(false);
          break;
        case "show_stats":
          router.push("/dashboard");
          setIsOpen(false);
          break;
        case "assign":
          router.push("/dashboard/map");
          setIsOpen(false);
          break;
        case "ai_response":
          // Show AI response inline — don't close
          setAiResponse(action.response);
          break;
      }
    },
    [router]
  );

  // Get flat list of suggestion actions for keyboard nav when query is empty
  const flatSuggestions = defaultSuggestions.flatMap((g) => g.items.map((i) => i.action));

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    loading,
    selectedIndex,
    setSelectedIndex,
    executeCommand,
    defaultSuggestions,
    flatSuggestions,
    aiResponse,
    setAiResponse,
  };
}
