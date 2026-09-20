/**
 * ConfidenceReview — Inline review component for low-confidence extractions.
 */

"use client";

import { useState } from "react";
import type { CommunityNeed } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CheckCircle, Edit3, X } from "lucide-react";

interface ConfidenceReviewProps {
  need: CommunityNeed;
  onApprove: (need: CommunityNeed) => void;
  onReject: () => void;
}

export default function ConfidenceReview({
  need,
  onApprove,
  onReject,
}: ConfidenceReviewProps) {
  const [editing, setEditing] = useState(false);
  const [editedNeed, setEditedNeed] = useState<CommunityNeed>(need);

  const handleSave = () => {
    setEditing(false);
    onApprove(editedNeed);
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Review Extraction
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-urgency-moderate animate-pulse" />
          <span className="text-xs text-urgency-moderate font-medium">
            Low Confidence
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Need type */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Need Type
          </label>
          {editing ? (
            <input
              type="text"
              value={editedNeed.need_type}
              onChange={(e) =>
                setEditedNeed({ ...editedNeed, need_type: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none"
            />
          ) : (
            <p className="text-sm font-medium text-gray-900 mt-1">
              {editedNeed.need_type}
            </p>
          )}
        </div>

        {/* Urgency */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Urgency Score
          </label>
          {editing ? (
            <input
              type="number"
              min={1}
              max={10}
              value={editedNeed.urgency_score}
              onChange={(e) =>
                setEditedNeed({
                  ...editedNeed,
                  urgency_score: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none"
            />
          ) : (
            <p className="text-sm font-medium text-gray-900 mt-1">
              {editedNeed.urgency_score}/10
            </p>
          )}
        </div>

        {/* Skills */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Required Skills
          </label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {editedNeed.required_skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 bg-accent-teal/10 text-accent-teal text-xs font-medium rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        {editing ? (
          <>
            <Button variant="primary" onClick={handleSave} className="flex-1">
              <CheckCircle size={16} className="mr-1.5" />
              Save & Approve
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={() => onApprove(editedNeed)} className="flex-1">
              <CheckCircle size={16} className="mr-1.5" />
              Approve
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Edit3 size={16} className="mr-1.5" />
              Edit
            </Button>
            <Button variant="danger" onClick={onReject}>
              <X size={16} className="mr-1.5" />
              Reject
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
