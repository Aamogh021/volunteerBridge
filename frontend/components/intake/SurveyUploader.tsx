/**
 * SurveyUploader — Drag-and-drop image upload with Gemini extraction.
 * Dark glassmorphism theme.
 */

"use client";

import { useCallback, useState, useRef } from "react";
import { UploadCloud, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { ingestSurvey } from "@/lib/api";
import type { IngestResponse } from "@/types";

interface SurveyUploaderProps {
  orgId?: string;
  onExtracted: (result: IngestResponse) => void;
}

export default function SurveyUploader({
  orgId = "default",
  onExtracted,
}: SurveyUploaderProps) {
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Only image files are accepted.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }
    setError(null);
    setFile(selectedFile);
  }, []);

  const handleUploadClick = async () => {
    const hasInput = activeTab === "image" ? file !== null : textInput.trim().length > 0;
    if (!hasInput) return;
    
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("org_id", orgId);
      if (activeTab === "image" && file) {
        formData.append("file", file);
      } else if (activeTab === "text" && textInput.trim().length > 0) {
        formData.append("text_content", textInput);
      }

      const result = await ingestSurvey(formData);
      setSuccess(true);
      setTimeout(() => {
        onExtracted(result);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      if (!success) setLoading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) processFileSelect(droppedFile);
    },
    [processFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFileSelect(selected);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const resetState = () => {
    setSuccess(false);
    setFile(null);
    setTextInput("");
    setError(null);
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '16px' }}>
        <CheckCircle2 size={48} color="#22c55e" />
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Upload successful!
        </span>
        <button onClick={resetState} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          Upload another
        </button>
      </div>
    );
  }

  const hasInput = activeTab === "image" ? file !== null : textInput.trim().length > 0;
  const isSubmitDisabled = loading || !hasInput;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {(['image', 'text'] as const).map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              position: 'relative', cursor: 'pointer',
              color: activeTab === tab ? '#a5b4fc' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: '14px',
              transition: 'color 0.2s',
            }}
          >
            {tab === 'image' ? 'Image Upload' : 'Text Input'}
            {activeTab === tab && (
              <div style={{
                position: 'absolute', bottom: '-9px', left: 0, right: 0,
                borderBottom: '2px solid #6366f1',
              }} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px', fontSize: '13px', color: '#fca5a5',
        }}>
          {error}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "image" ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!file && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`upload-zone ${dragging ? 'drag-over' : ''}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: '200px',
                }}
              >
                <UploadCloud size={40} color="var(--text-muted)" />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#a5b4fc' }}>Click to upload</span> or drag and drop
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  PNG, JPG up to 10MB
                </p>
              </div>
            </>
          )}

          {file && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <ImageIcon size={24} color="#6366f1" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste survey text or unstructured report data here..."
          style={{
            width: '100%', minHeight: '120px', padding: '12px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px', fontSize: '14px',
            color: 'var(--text-primary)',
            background: 'rgba(17, 24, 39, 0.5)',
            resize: 'vertical', outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = '#6366f1'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
      )}

      {/* Submit Button */}
      <button
        onClick={handleUploadClick}
        disabled={isSubmitDisabled}
        className="btn-primary"
        style={{
          width: '100%', padding: '12px', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: isSubmitDisabled ? 0.5 : 1,
          cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <>
            <div className="animate-spin" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            Processing...
          </>
        ) : (
          "Extract Information"
        )}
      </button>
    </div>
  );
}
