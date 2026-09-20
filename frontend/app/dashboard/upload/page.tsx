/**
 * Upload Survey page — Dark glassmorphism theme.
 */

"use client";

import { useState } from "react";
import SurveyUploader from "@/components/intake/SurveyUploader";
import ExtractionPreview from "@/components/intake/ExtractionPreview";
import type { IngestResponse } from "@/types";
import { Upload, Brain } from "lucide-react";

const ORG_ID = "default";

export default function UploadPage() {
  const [result, setResult] = useState<IngestResponse | null>(null);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Upload Survey
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Digitize handwritten or text community surveys via Gemini AI
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Card: Source Document */}
        <div className="card-static" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Upload size={16} color="#6366f1" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Source Document
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <SurveyUploader orgId={ORG_ID} onExtracted={setResult} />
          </div>
        </div>

        {/* Right Card: Extraction Result */}
        <div className="card-static" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Brain size={16} color="#22d3ee" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Intelligence Extraction
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <ExtractionPreview result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}
