/**
 * Command Parser — Rule-based parsing with Gemini AI fallback.
 * Parses natural language into structured dashboard actions.
 */

import axios from "axios";

export interface MapFilters {
  need_type?: string;
  zone?: string;
  urgency_min?: number;
  status?: string;
}

export interface VolunteerFilters {
  skill?: string;
  available?: boolean;
  zone?: string;
}

export type CommandAction =
  | { type: "navigate"; path: string; label: string }
  | { type: "filter_map"; filters: MapFilters; label: string }
  | { type: "show_volunteers"; filters: VolunteerFilters; label: string }
  | { type: "assign"; volunteerId?: string; needId?: string; label: string }
  | { type: "generate_report"; label: string }
  | { type: "show_stats"; label: string }
  | { type: "ai_response"; response: string; label: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Attempts rule-based parsing first; falls back to Gemini AI if no match.
 */
export async function parseCommand(input: string): Promise<CommandAction[]> {
  const q = input.toLowerCase().trim();
  if (!q) return [];

  // --- RULE-BASED PARSING (instant, no API call) ---

  // Navigation
  if (q.includes("crisis map") || (q.includes("map") && !q.includes("filter"))) {
    return [{ type: "navigate", path: "/dashboard/map", label: "Open Crisis Map" }];
  }
  if (q.includes("upload") || q.includes("survey")) {
    return [{ type: "navigate", path: "/dashboard/upload", label: "Open Upload Survey" }];
  }
  if (q.includes("intelligence") || q.includes("ai ") || q.includes("report page")) {
    return [{ type: "navigate", path: "/dashboard/intelligence", label: "Open AI Intelligence" }];
  }
  if (q.includes("overview") || q.includes("home") || q.includes("dashboard")) {
    return [{ type: "navigate", path: "/dashboard", label: "Go to Overview" }];
  }

  // Generate report
  if (q.includes("generate report") || q.includes("crisis report") || q.includes("generate intelligence")) {
    return [{ type: "generate_report", label: "Generate AI Crisis Report" }];
  }

  // Stats
  if (q.includes("stats") || q.includes("how many") || q.includes("statistics") || q.includes("impact")) {
    return [{ type: "show_stats", label: "Show Impact Statistics" }];
  }

  // Filter: urgency
  if (q.includes("critical") || q.includes("urgent")) {
    return [{ type: "filter_map", filters: { urgency_min: 8 }, label: "Show critical needs (urgency ≥ 8)" }];
  }

  // Filter: need type
  if (q.includes("medical")) {
    return [{ type: "filter_map", filters: { need_type: "Medical Aid" }, label: "Filter map: Medical Aid" }];
  }
  if (q.includes("food")) {
    return [{ type: "filter_map", filters: { need_type: "Food Distribution" }, label: "Filter map: Food Distribution" }];
  }
  if (q.includes("construction") || q.includes("debris")) {
    return [{ type: "filter_map", filters: { need_type: "Debris Clearing" }, label: "Filter map: Debris Clearing" }];
  }

  // Filter: status
  if (q.includes("unassigned")) {
    return [{ type: "filter_map", filters: { status: "unassigned" }, label: "Show unassigned needs" }];
  }
  if (q.includes("assigned") && !q.includes("unassigned")) {
    return [{ type: "filter_map", filters: { status: "assigned" }, label: "Show assigned needs" }];
  }

  // Filter: zone
  const zones: Record<string, string> = {
    dharavi: "Dharavi", sion: "Sion", kurla: "Kurla", chembur: "Chembur",
    bandra: "Bandra", matunga: "Matunga", wadala: "Wadala", parel: "Parel", byculla: "Byculla",
  };
  for (const [key, label] of Object.entries(zones)) {
    if (q.includes(key)) {
      return [{ type: "filter_map", filters: { zone: label }, label: `Show needs in ${label}` }];
    }
  }

  // Volunteer filters
  if (q.includes("nurse") || q.includes("nursing")) {
    return [{ type: "show_volunteers", filters: { skill: "nursing", available: true }, label: "Find available nurses" }];
  }
  if (q.includes("driver") || q.includes("driving")) {
    return [{ type: "show_volunteers", filters: { skill: "driving", available: true }, label: "Find available drivers" }];
  }
  if (q.includes("first aid")) {
    return [{ type: "show_volunteers", filters: { skill: "first aid", available: true }, label: "Find first aid volunteers" }];
  }
  if (q.includes("available volunteer")) {
    return [{ type: "show_volunteers", filters: { available: true }, label: "Show all available volunteers" }];
  }

  // Auto-assign
  if (q.includes("auto-assign") || q.includes("auto assign") || q.includes("assign top")) {
    return [{ type: "assign", label: "Auto-assign top volunteer to urgent needs" }];
  }

  // --- GEMINI FALLBACK (API call) ---
  try {
    const res = await axios.post(`${API_URL}/parse-command`, { input: q }, { timeout: 10000 });
    const data = res.data;

    const action = data.action as string;
    const label = data.label || "AI-parsed command";

    switch (action) {
      case "navigate":
        return [{ type: "navigate", path: data.path || "/dashboard", label }];
      case "filter_map":
        return [{ type: "filter_map", filters: data.filters || {}, label }];
      case "show_volunteers":
        return [{ type: "show_volunteers", filters: data.filters || {}, label }];
      case "assign":
        return [{ type: "assign", label }];
      case "generate_report":
        return [{ type: "generate_report", label }];
      case "show_stats":
        return [{ type: "show_stats", label }];
      case "ai_response":
        return [{ type: "ai_response", response: data.response || "I understood your request.", label }];
      default:
        return [{ type: "ai_response", response: data.response || label, label }];
    }
  } catch {
    return [{ type: "ai_response", response: `I understood you want to: "${input}". Try being more specific or use keywords like "map", "critical", "medical".`, label: "AI Response" }];
  }
}

/**
 * Returns default suggestion groups shown when input is empty.
 */
export function getDefaultSuggestions(): { category: string; icon: string; color: string; items: { text: string; action: CommandAction }[] }[] {
  return [
    {
      category: "Navigation",
      icon: "MapPin",
      color: "#185FA5",
      items: [
        { text: "Show crisis map", action: { type: "navigate", path: "/dashboard/map", label: "Open Crisis Map" } },
        { text: "Go to upload survey", action: { type: "navigate", path: "/dashboard/upload", label: "Open Upload Survey" } },
        { text: "Open AI intelligence", action: { type: "navigate", path: "/dashboard/intelligence", label: "Open AI Intelligence" } },
      ],
    },
    {
      category: "Filter & Search",
      icon: "Filter",
      color: "#1D9E75",
      items: [
        { text: "Show critical needs only", action: { type: "filter_map", filters: { urgency_min: 8 }, label: "Show critical needs" } },
        { text: "Find available medical volunteers", action: { type: "show_volunteers", filters: { skill: "medical", available: true }, label: "Find medical volunteers" } },
        { text: "Show needs in Dharavi", action: { type: "filter_map", filters: { zone: "Dharavi" }, label: "Show needs in Dharavi" } },
      ],
    },
    {
      category: "Actions",
      icon: "Zap",
      color: "#EF9F27",
      items: [
        { text: "Assign top volunteer", action: { type: "assign", label: "Auto-assign top volunteer" } },
        { text: "Generate crisis report", action: { type: "generate_report", label: "Generate AI Crisis Report" } },
        { text: "Show impact statistics", action: { type: "show_stats", label: "Show Impact Statistics" } },
      ],
    },
  ];
}
