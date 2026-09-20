/**
 * NeedMarker — Individual map marker element for a community need.
 * Used as a standalone component when custom rendering is needed.
 */

"use client";

import type { CommunityNeed } from "@/types";
import { UrgencyBadge } from "@/components/ui/Badge";

interface NeedMarkerProps {
  need: CommunityNeed;
  selected?: boolean;
  onClick?: () => void;
}

export default function NeedMarker({
  need,
  selected = false,
  onClick,
}: NeedMarkerProps) {
  const borderColor =
    need.urgency_score >= 8
      ? "border-urgency-critical"
      : need.urgency_score >= 5
        ? "border-urgency-moderate"
        : "border-urgency-low";

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 bg-white rounded-lg shadow-md
        border-l-4 ${borderColor} px-3 py-2
        hover:shadow-lg transition-all duration-200
        ${selected ? "ring-2 ring-brand-500 ring-offset-1" : ""}
      `}
    >
      <div className="flex flex-col items-start min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <UrgencyBadge score={need.urgency_score} />
          <span className="text-xs text-gray-500">{need.location.zone}</span>
        </div>
        <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
          {need.need_type}
        </p>
        <div className="flex gap-1 mt-1">
          {need.required_skills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {skill}
            </span>
          ))}
          {need.required_skills.length > 2 && (
            <span className="text-[10px] text-gray-400">
              +{need.required_skills.length - 2}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
