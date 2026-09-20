/**
 * FullPageSpinner and Spinner — Dark theme loading indicators.
 */

"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export default function Spinner({ size = "md", label, className = "" }: SpinnerProps) {
  const sizeMap = { sm: 16, md: 24, lg: 32 };
  const px = sizeMap[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className={className}>
      <div
        className="animate-spin"
        style={{
          width: `${px}px`,
          height: `${px}px`,
          borderRadius: '50%',
          border: '2px solid var(--border-subtle)',
          borderTopColor: '#6366f1',
        }}
      />
      {label && (
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
      )}
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        gap: '16px',
      }}
    >
      <div
        className="animate-spin"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border-subtle)',
          borderTopColor: '#6366f1',
        }}
      />
      {label && (
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
      )}
    </div>
  );
}
