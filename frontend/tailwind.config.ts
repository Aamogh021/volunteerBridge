import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-500': "#6366f1",
        'brand-700': "#4f46e5",
        'brand-sidebar': "#0a0e1a",
        'brand-sidebar-text': "#94a3b8",
        'surface-muted': "#0a0e1a",
        'surface-white': "#1a2035",
        'text-primary': "#f1f5f9",
        'text-secondary': "#94a3b8",
        'text-muted': "#64748b",
        'border-default': "rgba(99, 102, 241, 0.15)",
        'accent-teal': "#22d3ee",
        'accent-emerald': "#34d399",
        'urgency-critical': "#ef4444",
        'urgency-moderate': "#f59e0b",
        'urgency-low': "#22c55e",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;