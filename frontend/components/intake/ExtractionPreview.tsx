/**
 * ExtractionPreview — Displays AI-extracted need data with confidence scoring.
 */

"use client";

import type { IngestResponse } from "@/types";
import { FileSearch } from "lucide-react";

interface ExtractionPreviewProps {
  result: IngestResponse | null;
}

export default function ExtractionPreview({ result }: ExtractionPreviewProps) {
  if (!result) {
    return (
      <div 
        className="flex flex-col items-center justify-center"
        style={{ minHeight: '240px', gap: '12px' }}
      >
        <FileSearch size={48} color="#CBD5E1" />
        <span style={{ fontSize: '15px', color: '#64748B' }}>
          Awaiting Extraction
        </span>
      </div>
    );
  }

  const { need, confidence_score } = result;
  const reliability = Math.round(confidence_score * 100);

  const renderRow = (label: string, content: React.ReactNode) => (
    <div 
      className="flex flex-row items-center"
      style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '12px' }}
    >
      <div 
        className="flex-shrink-0"
        style={{ width: '120px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}
      >
        {label}
      </div>
      <div 
        className="flex-1"
        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
      >
        {content}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      {renderRow("Need Type", need.need_type)}
      {renderRow("Location", need.location.zone)}
      
      {renderRow(
        "Urgency", 
        <div className="flex flex-col gap-1">
          <span style={{ color: need.urgency_score >= 8 ? '#E24B4A' : 'var(--text-primary)' }}>
            {need.urgency_score}/10
          </span>
          <div className="flex flex-row" style={{ gap: '2px', height: '8px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: i < need.urgency_score ? (need.urgency_score >= 8 ? '#E24B4A' : '#EF9F27') : 'var(--border-subtle)',
                  borderRadius: '1px'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {renderRow(
        "Needs Description", 
        <div className="flex flex-wrap gap-2">
          {need.required_skills.join(", ")}
        </div>
      )}

      {renderRow(
        "Reliability",
        <div className="flex flex-col gap-1">
          <span>{reliability}%</span>
          <div style={{ width: '100%', backgroundColor: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
            <div 
              style={{
                height: '6px',
                backgroundColor: '#1D9E75',
                width: `${reliability}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
