/**
 * Buddy System + Real-Time Check-in + SOS (Women Safety)
 * Assigns every female volunteer a trusted buddy, enables live location sharing,
 * mandatory periodic check-ins, and emergency SOS button.
 */

"use client";

import { useState, useEffect } from "react";
import {
  Shield, Phone, MapPin, Clock, AlertTriangle,
  CheckCircle, Users, Heart, Radio, Eye, Bell,
  Flame, Activity, Timer, Siren
} from "lucide-react";

// Mock data for buddy pairs
const MOCK_BUDDY_PAIRS = [
  {
    id: 'bp1',
    volunteer: { name: 'Priya Sharma', avatar: '👩', location: 'Dharavi, Mumbai', phone: '+91 98765 43210', status: 'active', lastCheckin: '2 min ago', lat: 19.0440, lng: 72.8527 },
    buddy: { name: 'Anita Desai', avatar: '👩‍🦱', location: 'Dharavi, Mumbai', phone: '+91 98765 43211', status: 'active', lastCheckin: '5 min ago' },
    checkinStatus: 'on-time',
    sosActive: false,
    zone: 'Dharavi Relief Camp',
    riskLevel: 'moderate',
  },
  {
    id: 'bp2',
    volunteer: { name: 'Meera Patel', avatar: '👩‍🔬', location: 'Kurla East', phone: '+91 98765 43212', status: 'active', lastCheckin: '1 min ago', lat: 19.0726, lng: 72.8796 },
    buddy: { name: 'Kavita Joshi', avatar: '👩‍⚕️', location: 'Kurla East', phone: '+91 98765 43213', status: 'active', lastCheckin: '3 min ago' },
    checkinStatus: 'on-time',
    sosActive: false,
    zone: 'Kurla Medical Camp',
    riskLevel: 'low',
  },
  {
    id: 'bp3',
    volunteer: { name: 'Sunita Rao', avatar: '👩‍🏫', location: 'Bandra West', phone: '+91 98765 43214', status: 'active', lastCheckin: '18 min ago', lat: 19.0596, lng: 72.8295 },
    buddy: { name: 'Deepa Nair', avatar: '👩‍💼', location: 'Bandra West', phone: '+91 98765 43215', status: 'delayed', lastCheckin: '22 min ago' },
    checkinStatus: 'overdue',
    sosActive: false,
    zone: 'Bandra Distribution Center',
    riskLevel: 'high',
  },
  {
    id: 'bp4',
    volunteer: { name: 'Lakshmi Iyer', avatar: '👩‍🍳', location: 'Andheri East', phone: '+91 98765 43216', status: 'sos', lastCheckin: '32 min ago', lat: 19.1136, lng: 72.8697 },
    buddy: { name: 'Rashmi Gupta', avatar: '👩‍🎤', location: 'Andheri East', phone: '+91 98765 43217', status: 'responding', lastCheckin: '1 min ago' },
    checkinStatus: 'sos-triggered',
    sosActive: true,
    zone: 'Andheri Flood Zone',
    riskLevel: 'critical',
  },
];

const CHECKIN_INTERVAL = 15; // minutes

function getRiskBadge(level: string) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    low: { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: 'rgba(34, 197, 94, 0.3)' },
    moderate: { bg: 'rgba(34, 211, 238, 0.15)', color: '#67e8f9', border: 'rgba(34, 211, 238, 0.3)' },
    high: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.3)' },
    critical: { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' },
  };
  const s = styles[level] || styles.low;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {level}
    </span>
  );
}

export default function BuddySystemPage() {
  const [pairs, setPairs] = useState(MOCK_BUDDY_PAIRS);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);

  // Stats
  const totalPairs = pairs.length;
  const activePairs = pairs.filter(p => !p.sosActive && p.checkinStatus !== 'overdue').length;
  const overduePairs = pairs.filter(p => p.checkinStatus === 'overdue').length;
  const sosPairs = pairs.filter(p => p.sosActive).length;

  const handleTriggerSOS = (pairId: string) => {
    setPairs(prev => prev.map(p =>
      p.id === pairId ? { ...p, sosActive: true, checkinStatus: 'sos-triggered', riskLevel: 'critical' } : p
    ));
  };

  const handleResolve = (pairId: string) => {
    setPairs(prev => prev.map(p =>
      p.id === pairId ? { ...p, sosActive: false, checkinStatus: 'on-time', riskLevel: 'low' } : p
    ));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={22} color="#6366f1" /> Buddy System & SOS
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Women safety monitoring — Real-time check-ins, live location, emergency SOS
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Active Pairs', value: activePairs, Icon: Users, color: '#22c55e' },
          { label: 'Total Monitored', value: totalPairs * 2, Icon: Eye, color: '#6366f1' },
          { label: 'Overdue Check-ins', value: overduePairs, Icon: Timer, color: '#f59e0b' },
          { label: 'SOS Active', value: sosPairs, Icon: AlertTriangle, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '6px' }}><s.Icon size={20} color={s.color} /></div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</p>
            <span style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* SOS Alert Banner */}
      {sosPairs > 0 && (
        <div className="animate-sos-pulse" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#fca5a5', margin: 0 }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />{sosPairs} SOS Alert{sosPairs > 1 ? 's' : ''} Active
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Emergency response teams have been notified. Buddy is en route.
              </p>
            </div>
          </div>
          <button className="btn-danger" style={{ padding: '10px 20px', fontSize: '13px' }}>
            <Phone size={14} style={{ marginRight: 6 }} />
            Contact Emergency
          </button>
        </div>
      )}

      {/* Buddy Pair Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {pairs.map((pair) => (
          <div
            key={pair.id}
            className={pair.sosActive ? '' : 'card'}
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: pair.sosActive ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)',
              border: `1px solid ${pair.sosActive ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
              transition: 'all 0.3s ease',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color={pair.sosActive ? '#ef4444' : '#6366f1'} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{pair.zone}</span>
              </div>
              {getRiskBadge(pair.riskLevel)}
            </div>

            {/* Volunteer & Buddy Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {/* Volunteer */}
              <div style={{
                padding: '14px', borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{pair.volunteer.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{pair.volunteer.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Volunteer</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <MapPin size={11} /> {pair.volunteer.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <Clock size={11} /> Last check-in: {pair.volunteer.lastCheckin}
                </div>
              </div>

              {/* Buddy */}
              <div style={{
                padding: '14px', borderRadius: '12px',
                background: 'rgba(34, 211, 238, 0.05)',
                border: '1px solid rgba(34, 211, 238, 0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #22d3ee, #0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{pair.buddy.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{pair.buddy.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Trusted Buddy</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <MapPin size={11} /> {pair.buddy.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <Clock size={11} /> Last check-in: {pair.buddy.lastCheckin}
                </div>
              </div>
            </div>

            {/* Check-in Progress */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Check-in Timer
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: pair.checkinStatus === 'on-time' ? '#22c55e' : pair.checkinStatus === 'overdue' ? '#f59e0b' : '#ef4444',
                }}>
                  {pair.checkinStatus === 'on-time' ? '✓ On Time' : pair.checkinStatus === 'overdue' ? '! Overdue' : '⚑ SOS Active'}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: pair.checkinStatus === 'on-time' ? '30%' : pair.checkinStatus === 'overdue' ? '85%' : '100%',
                  background: pair.checkinStatus === 'on-time'
                    ? 'linear-gradient(90deg, #22c55e, #34d399)'
                    : pair.checkinStatus === 'overdue'
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : 'linear-gradient(90deg, #ef4444, #f87171)',
                }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {pair.sosActive ? (
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => handleResolve(pair.id)}
                >
                  <CheckCircle size={14} /> Mark Resolved
                </button>
              ) : (
                <>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Eye size={14} /> Track Live
                  </button>
                  <button
                    className="btn-danger"
                    style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => handleTriggerSOS(pair.id)}
                  >
                    <AlertTriangle size={14} /> SOS
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live Location Map Placeholder */}
      <div className="card-static" style={{ padding: '24px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Radio size={18} color="#22d3ee" /> Live Location Tracking
        </h3>
        <div style={{
          height: '300px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Mock markers */}
          {pairs.map((pair, i) => (
            <div key={pair.id} style={{
              position: 'absolute',
              left: `${20 + i * 20}%`,
              top: `${30 + (i % 2) * 25}%`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}>
              {pair.sosActive && (
                <div style={{
                  position: 'absolute', inset: '-12px', borderRadius: '50%',
                  border: '2px solid #ef4444',
                  animation: 'markerPulse 2s ease-out infinite',
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: pair.sosActive ? '#ef4444' : pair.checkinStatus === 'overdue' ? '#f59e0b' : '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: 'white',
                boxShadow: `0 0 20px ${pair.sosActive ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.3)'}`,
                border: '3px solid rgba(255,255,255,0.2)',
              }}>
                {pair.volunteer.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
              </div>
              <p style={{
                fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)',
                textAlign: 'center', marginTop: '4px', whiteSpace: 'nowrap',
              }}>
                {pair.volunteer.name.split(' ')[0]}
              </p>
            </div>
          ))}

          {/* Center label */}
          <div style={{
            position: 'absolute', bottom: '16px', left: '16px',
            background: 'rgba(10, 14, 26, 0.8)',
            padding: '8px 14px', borderRadius: '8px',
            fontSize: '12px', color: 'var(--text-secondary)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-subtle)',
          }}>
<MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Mumbai Metropolitan Area — {pairs.length} pairs tracked
          </div>
        </div>
      </div>
    </div>
  );
}
