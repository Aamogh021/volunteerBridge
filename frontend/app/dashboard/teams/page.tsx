/**
 * Micro-Team Auto Formation (Balanced Response Units)
 * Automatically creates optimized teams combining volunteers with complementary skills:
 * Medic + Driver + Logistics + Local guide
 */

"use client";

import { useState } from "react";
import {
  Users, Zap, Star, MapPin, Shield,
  RefreshCw, CheckCircle, ArrowRight, Clock,
  Heart, Truck, Wrench, Navigation, Brain,
  Stethoscope, Car, Package, Compass,
  Target, Rocket
} from "lucide-react";

// Skill icon colours for badge
const SKILL_COLORS: Record<string, string> = {
  'Medic': '#ef4444',
  'Driver': '#22d3ee',
  'Logistics': '#f59e0b',
  'Local Guide': '#22c55e',
  'Communication': '#6366f1',
  'First Aid': '#f97316',
  'Construction': '#a16207',
  'Counseling': '#8b5cf6',
  'Water Rescue': '#0ea5e9',
  'Translator': '#10b981',
};

const MOCK_TEAMS = [
  {
    id: 'team1',
    name: 'Alpha Response Unit',
    zone: 'Dharavi, Mumbai',
    status: 'deployed',
    matchScore: 96,
    members: [
      { name: 'Dr. Aarav Singh', skill: 'Medic', experience: '8 years', reliability: 97, avatar: '👨‍⚕️' },
      { name: 'Rajesh Kumar', skill: 'Driver', experience: '5 years', reliability: 92, avatar: '👨‍✈️' },
      { name: 'Sanjay Mehta', skill: 'Logistics', experience: '6 years', reliability: 94, avatar: '👷' },
      { name: 'Anil Patil', skill: 'Local Guide', experience: '12 years', reliability: 98, avatar: '🧑‍🦱' },
    ],
    mission: 'Medical aid distribution at flood-affected zone',
    eta: '15 min',
    priority: 'critical',
  },
  {
    id: 'team2',
    name: 'Bravo Relief Squad',
    zone: 'Kurla East',
    status: 'en-route',
    matchScore: 91,
    members: [
      { name: 'Dr. Neha Patel', skill: 'First Aid', experience: '4 years', reliability: 95, avatar: '👩‍⚕️' },
      { name: 'Vikram Desai', skill: 'Driver', experience: '7 years', reliability: 88, avatar: '🧑‍✈️' },
      { name: 'Priya Nair', skill: 'Communication', experience: '3 years', reliability: 96, avatar: '👩‍💻' },
      { name: 'Mohammed Ali', skill: 'Construction', experience: '10 years', reliability: 93, avatar: '👨‍🔧' },
    ],
    mission: 'Shelter setup and infrastructure repair',
    eta: '25 min',
    priority: 'high',
  },
  {
    id: 'team3',
    name: 'Charlie Search Unit',
    zone: 'Bandra West',
    status: 'standby',
    matchScore: 88,
    members: [
      { name: 'Kavita Joshi', skill: 'Counseling', experience: '5 years', reliability: 91, avatar: '👩‍🏫' },
      { name: 'Suresh Reddy', skill: 'Water Rescue', experience: '6 years', reliability: 94, avatar: '🏊‍♂️' },
      { name: 'Lisa Fernandez', skill: 'Translator', experience: '4 years', reliability: 89, avatar: '👩' },
      { name: 'Deepak Sharma', skill: 'Local Guide', experience: '8 years', reliability: 96, avatar: '🧔' },
    ],
    mission: 'Community outreach and psychological support',
    eta: 'On standby',
    priority: 'moderate',
  },
  {
    id: 'team4',
    name: 'Delta Rescue Team',
    zone: 'Andheri East',
    status: 'forming',
    matchScore: 85,
    members: [
      { name: 'Dr. Ritu Gupta', skill: 'Medic', experience: '6 years', reliability: 93, avatar: '👩‍⚕️' },
      { name: 'Kiran Shah', skill: 'Driver', experience: '3 years', reliability: 87, avatar: '🧑' },
      { name: 'Amit Verma', skill: 'Logistics', experience: '4 years', reliability: 90, avatar: '👨‍💼' },
      { name: 'Reshma Kulkarni', skill: 'First Aid', experience: '2 years', reliability: 85, avatar: '👩‍🔬' },
    ],
    mission: 'Flood zone rescue and evacuation support',
    eta: 'Forming...',
    priority: 'high',
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case 'deployed': return { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: 'rgba(34, 197, 94, 0.3)', label: '● Deployed' };
    case 'en-route': return { bg: 'rgba(34, 211, 238, 0.15)', color: '#67e8f9', border: 'rgba(34, 211, 238, 0.3)', label: '▶ En Route' };
    case 'standby': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.3)', label: '◼ Standby' };
    case 'forming': return { bg: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)', label: '⟳ Forming' };
    default: return { bg: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)', label: status };
  }
}

function getPriorityStyles(priority: string) {
  switch (priority) {
    case 'critical': return { color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
    case 'high': return { color: '#fcd34d', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
    case 'moderate': return { color: '#67e8f9', bg: 'rgba(34, 211, 238, 0.15)', border: 'rgba(34, 211, 238, 0.3)' };
    default: return { color: '#86efac', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' };
  }
}

export default function TeamsPage() {
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [isAutoForming, setIsAutoForming] = useState(false);

  const handleAutoForm = () => {
    setIsAutoForming(true);
    setTimeout(() => {
      setIsAutoForming(false);
    }, 2000);
  };

  const deployedCount = teams.filter(t => t.status === 'deployed').length;
  const totalVolunteers = teams.reduce((s, t) => s + t.members.length, 0);
  const avgMatch = Math.round(teams.reduce((s, t) => s + t.matchScore, 0) / teams.length);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="#6366f1" /> Micro-Team Auto Formation
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            AI-optimized balanced response units — Medic + Driver + Logistics + Local Guide
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleAutoForm}
          disabled={isAutoForming}
          style={{
            padding: '12px 24px', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          {isAutoForming ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> Optimizing...
            </>
          ) : (
            <>
              <Zap size={16} /> Auto-Form Teams
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Active Teams', value: teams.length, Icon: Target, color: '#6366f1' },
          { label: 'Deployed', value: deployedCount, Icon: Rocket, color: '#22c55e' },
          { label: 'Total Volunteers', value: totalVolunteers, Icon: Users, color: '#22d3ee' },
          { label: 'Avg Match Score', value: `${avgMatch}%`, Icon: Zap, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '6px' }}><s.Icon size={20} color={s.color} /></div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</p>
            <span style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="card-static" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(34,211,238,0.04))',
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Brain size={18} color="#6366f1" /> AI Team Composition Logic
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { skill: 'Medic', Icon: Stethoscope, color: '#ef4444' },
            { skill: 'Driver', Icon: Car, color: '#22d3ee' },
            { skill: 'Logistics', Icon: Package, color: '#f59e0b' },
            { skill: 'Local Guide', Icon: Compass, color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px',
                background: `rgba(${s.color === '#ef4444' ? '239,68,68' : s.color === '#22d3ee' ? '34,211,238' : s.color === '#f59e0b' ? '245,158,11' : '34,197,94'}, 0.1)`,
                border: `1px solid ${s.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.Icon size={22} color={s.color} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{s.skill}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Essential</p>
              </div>
              {i < 3 && <ArrowRight size={16} color="var(--text-muted)" style={{ margin: '0 4px' }} />}
            </div>
          ))}
          <div style={{
            marginLeft: '8px', padding: '8px 16px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
          }}>
            <p style={{ fontWeight: 700, fontSize: '13px', color: '#a5b4fc', margin: 0 }}>= Balanced Unit</p>
          </div>
        </div>
      </div>

      {/* Team Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {teams.map((team) => {
          const statusS = getStatusStyles(team.status);
          const priorityS = getPriorityStyles(team.priority);

          return (
            <div key={team.id} className="card-static" style={{ overflow: 'hidden' }}>
              {/* Team Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
                      {team.name}
                    </h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: statusS.bg, color: statusS.color, border: `1px solid ${statusS.border}`,
                    }}>
                      {statusS.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {team.zone}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> ETA: {team.eta}
                    </span>
                  </div>
                </div>

                {/* Match Score */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    border: '3px solid #6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(99, 102, 241, 0.1)',
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#a5b4fc' }}>{team.matchScore}%</span>
                  </div>
                  <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Match</p>
                </div>
              </div>

              {/* Mission */}
              <div style={{
                padding: '12px 24px',
                background: 'rgba(99, 102, 241, 0.03)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                  background: priorityS.bg, color: priorityS.color, border: `1px solid ${priorityS.border}`,
                  textTransform: 'uppercase',
                }}>
                  {team.priority}
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                  {team.mission}
                </p>
              </div>

              {/* Members */}
              <div style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {team.members.map((member, mi) => (
                    <div key={mi} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'rgba(17, 24, 39, 0.5)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${SKILL_COLORS[member.skill] || '#6366f1'}, #1e1b4b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                            {member.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                              background: `rgba(${SKILL_COLORS[member.skill] ? '99,102,241' : '99,102,241'}, 0.15)`, color: '#a5b4fc',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                            }}>
                              {member.skill}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.experience}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reliability */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: 700,
                          color: member.reliability >= 95 ? '#22c55e' : member.reliability >= 85 ? '#22d3ee' : '#f59e0b',
                        }}>
                          {member.reliability}%
                        </span>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>Reliable</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Actions */}
              <div style={{
                padding: '12px 24px 20px',
                display: 'flex', gap: '8px',
              }}>
                {team.status === 'forming' ? (
                  <button className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle size={14} /> Confirm & Deploy
                  </button>
                ) : team.status === 'standby' ? (
                  <button className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Zap size={14} /> Activate Team
                  </button>
                ) : (
                  <button className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Navigation size={14} /> Track Team
                  </button>
                )}
                <button className="btn-secondary" style={{ padding: '10px 16px', fontSize: '13px' }}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
