/**
 * Badge component for urgency and status indicators.
 */

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "critical" | "moderate" | "low" | "info" | "success" | "warning";
  size?: "sm" | "md";
  className?: string;
}

const variantClasses: Record<string, string> = {
  critical: "bg-red-100 text-urgency-critical border-red-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-urgency-low border-green-200",
  info: "bg-blue-100 text-brand-500 border-blue-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const sizeClasses: Record<string, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "info",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export function UrgencyBadge({ score }: { score: number }) {
  if (score >= 8) {
    return <Badge variant="critical">CRITICAL</Badge>;
  }
  if (score >= 5) {
    return <Badge variant="moderate">MODERATE</Badge>;
  }
  return <Badge variant="low">LOW</Badge>;
}
