"use client";
import React from "react";
/**
 * Disaster Prediction Dashboard
 * Predicts upcoming risks (floods, heatwaves, etc.) in regions like Maharashtra and Gujarat.
 * Displays probability, timeline, impact; suggests resource allocation and volunteer deployment.
 */

import { useState } from "react";
import {
  CloudLightning, Droplets, Thermometer, Wind,
  AlertTriangle, MapPin, TrendingUp, Users,
  ArrowRight, Clock, Shield, Brain,
  CloudRain, Flame, Mountain,
  BarChart2, AlertOctagon, Home
} from "lucide-react";

// Map type -> lucide icon component
const TYPE_ICONS: Record<string, React.ElementType> = {
  Flood: Droplets,
  Heatwave: Flame,
  Cyclone: Wind,
  Landslide: Mountain,
};

const PREDICTIONS = [
  {
    id: 'pred1',
    type: 'Flood',
    icon: 'Flood',
    region: 'Mumbai, Maharashtra',
    probability: 87,
    timeline: '48-72 hours',
    severity: 'critical',
    impact: {
      population: '2.3M',
      area: '145 sq km',
      infrastructure: 'Roads, Railways, Power Grid',
    },
    recommendations: [
      'Deploy 120 volunteers to Dharavi, Kurla, Sion areas',
      'Pre-position medical supplies at 8 relief centers',
      'Activate evacuation protocols for low-lying zones',
      'Coordinate with NDRF teams for rescue operations',
    ],
    resources: {
      volunteersNeeded: 120,
      volunteersAvailable: 85,
      medicalKits: 200,
      shelterCapacity: '15,000',
    },
    trend: 'increasing',
    lastUpdated: '15 min ago',
  },
  {
    id: 'pred2',
    type: 'Heatwave',
    icon: 'Heatwave',
    region: 'Ahmedabad, Gujarat',
    probability: 92,
    timeline: '24-48 hours',
    severity: 'high',
    impact: {
      population: '1.8M',
      area: '85 sq km',
      infrastructure: 'Water Supply, Power Grid',
    },
    recommendations: [
      'Set up 15 cooling centers across affected zones',
      'Deploy water distribution teams in Maninagar, Navrangpura',
      'Alert hospitals for heatstroke preparedness',
      'Distribute ORS packets and sunscreen to outdoor workers',
    ],
    resources: {
      volunteersNeeded: 75,
      volunteersAvailable: 62,
      medicalKits: 150,
      shelterCapacity: '8,000',
    },
    trend: 'stable',
    lastUpdated: '30 min ago',
  },
  {
    id: 'pred3',
    type: 'Cyclone',
    icon: 'Cyclone',
    region: 'Surat, Gujarat',
    probability: 45,
    timeline: '5-7 days',
    severity: 'moderate',
    impact: {
      population: '850K',
      area: '60 sq km',
      infrastructure: 'Coastal Infrastructure, Ports',
    },
    recommendations: [
      'Begin early warning communication to coastal communities',
      'Identify and prepare evacuation routes',
      'Stock emergency supplies at 5 staging areas',
      'Brief volunteer teams on cyclone response protocols',
    ],
    resources: {
      volunteersNeeded: 50,
      volunteersAvailable: 45,
      medicalKits: 100,
      shelterCapacity: '5,000',
    },
    trend: 'increasing',
    lastUpdated: '1 hour ago',
  },
  {
    id: 'pred4',
    type: 'Landslide',
    icon: 'Landslide',
    region: 'Pune, Maharashtra',
    probability: 35,
    timeline: '7-10 days',
    severity: 'low',
    impact: {
      population: '120K',
      area: '15 sq km',
      infrastructure: 'Hill Roads, Residential Areas',
    },
    recommendations: [
      'Monitor soil moisture levels in Lonavala-Khandala stretch',
      'Identify vulnerable settlements on hill slopes',
      'Prepare search and rescue equipment',
      'Coordinate with geological survey teams',
    ],
    resources: {
      volunteersNeeded: 25,
      volunteersAvailable: 30,
      medicalKits: 50,
      shelterCapacity: '2,000',
    },
    trend: 'decreasing',
    lastUpdated: '2 hours ago',
  },
];

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'critical': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)', barColor: '#ef4444' };
    case 'high': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.3)', barColor: '#f59e0b' };
    case 'moderate': return { bg: 'rgba(34, 211, 238, 0.15)', color: '#67e8f9', border: 'rgba(34, 211, 238, 0.3)', barColor: '#22d3ee' };
    case 'low': return { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: 'rgba(34, 197, 94, 0.3)', barColor: '#22c55e' };
    default: return { bg: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)', barColor: '#6366f1' };
  }
}

function getProbabilityColor(prob: number) {
  if (prob >= 80) return '#ef4444';
  if (prob >= 60) return '#f59e0b';
  if (prob >= 40) return '#22d3ee';
  return '#22c55e';
}

export default function PredictionsPage() {
  const [expandedId, setExpandedId] = useState<string | null>('pred1');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CloudRain size={22} color="#22d3ee" /> Disaster Prediction Dashboard
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          AI-driven risk forecasting for Maharashtra & Gujarat — proactive disaster management
        </p>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Active Predictions', value: PREDICTIONS.length, Icon: BarChart2, color: '#6366f1' },
          { label: 'Critical Alerts', value: PREDICTIONS.filter(p => p.severity === 'critical').length, Icon: AlertTriangle, color: '#ef4444' },
          { label: 'Volunteers Needed', value: PREDICTIONS.reduce((s, p) => s + p.resources.volunteersNeeded, 0), Icon: Users, color: '#22d3ee' },
          { label: 'Population at Risk', value: '5.1M', Icon: Home, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '6px' }}><s.Icon size={20} color={s.color} /></div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</p>
            <span style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Prediction Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {PREDICTIONS.map((pred) => {
          const sev = getSeverityStyles(pred.severity);
          const isExpanded = expandedId === pred.id;
          const probColor = getProbabilityColor(pred.probability);

          return (
            <div
              key={pred.id}
              className="card-static"
              style={{
                overflow: 'hidden',
                borderLeft: `4px solid ${sev.barColor}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => setExpandedId(isExpanded ? null : pred.id)}
            >
              {/* Header Row */}
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: `rgba(${pred.probability >= 80 ? '239,68,68' : pred.probability >= 60 ? '245,158,11' : '34,211,238'}, 0.12)`, border: `1px solid rgba(${pred.probability >= 80 ? '239,68,68' : pred.probability >= 60 ? '245,158,11' : '34,211,238'}, 0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.createElement(TYPE_ICONS[pred.type] || CloudLightning, { size: 24, color: pred.probability >= 80 ? '#ef4444' : pred.probability >= 60 ? '#f59e0b' : '#22d3ee' })}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
                        {pred.type} Risk — {pred.region}
                      </h3>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
                        textTransform: 'uppercase',
                      }}>
                        {pred.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      ETA: {pred.timeline} • Updated {pred.lastUpdated}
                    </p>
                  </div>
                </div>

                {/* Probability Gauge */}
                <div style={{ textAlign: 'center', minWidth: '80px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: `3px solid ${probColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `rgba(${pred.probability >= 80 ? '239,68,68' : pred.probability >= 60 ? '245,158,11' : '34,211,238'}, 0.1)`,
                    margin: '0 auto',
                  }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: probColor }}>{pred.probability}%</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Probability
                  </p>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{
                  padding: '0 24px 24px',
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: '-4px',
                  paddingTop: '20px',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    {/* Impact */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                    }}>
                      <p style={{ fontWeight: 600, fontSize: '12px', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} /> Impact Assessment
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Population:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pred.impact.population}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Area:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pred.impact.area}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Infra:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pred.impact.infrastructure}</span></div>
                      </div>
                    </div>

                    {/* Resources */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                    }}>
                      <p style={{ fontWeight: 600, fontSize: '12px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        <Users size={12} style={{ display: 'inline', marginRight: 4 }} /> Resource Status
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Volunteers:</span>{' '}
                          <span style={{ color: pred.resources.volunteersAvailable >= pred.resources.volunteersNeeded ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                            {pred.resources.volunteersAvailable}/{pred.resources.volunteersNeeded}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Medical Kits:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pred.resources.medicalKits}</span></div>
                        <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Shelter Cap:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pred.resources.shelterCapacity}</span></div>
                      </div>

                      {/* Volunteer readiness bar */}
                      <div style={{ marginTop: '12px' }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{
                            width: `${Math.min((pred.resources.volunteersAvailable / pred.resources.volunteersNeeded) * 100, 100)}%`,
                            background: pred.resources.volunteersAvailable >= pred.resources.volunteersNeeded
                              ? 'linear-gradient(90deg, #22c55e, #34d399)'
                              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                          }} />
                        </div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Volunteer Readiness: {Math.round((pred.resources.volunteersAvailable / pred.resources.volunteersNeeded) * 100)}%
                        </p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: 'rgba(34, 211, 238, 0.05)',
                      border: '1px solid rgba(34, 211, 238, 0.15)',
                    }}>
                      <p style={{ fontWeight: 600, fontSize: '12px', color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        <Brain size={12} style={{ display: 'inline', marginRight: 4 }} /> AI Recommendations
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pred.recommendations.map((rec, ri) => (
                          <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 700, color: 'white', flexShrink: 0,
                              marginTop: '1px',
                            }}>{ri + 1}</div>
                            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} /> Deploy Volunteers
                    </button>
                    <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={14} /> Allocate Resources
                    </button>
                    <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Brain size={14} /> Generate Detailed Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
