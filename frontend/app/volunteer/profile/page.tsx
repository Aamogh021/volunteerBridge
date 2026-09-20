/**
 * Volunteer Profile — Edit skills, availability, and personal info.
 */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  UserCircle,
  Save,
  ArrowLeft,
  MapPin,
  Star,
  CheckCircle2,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";

const SKILL_OPTIONS = [
  "First Aid", "Medical", "Search & Rescue", "Logistics",
  "Translation", "Counseling", "Driving", "Cooking",
  "Construction", "IT Support", "Education", "Legal Aid",
  "Water Purification", "Crowd Management", "Fire Safety",
];

export default function VolunteerProfilePage() {
  const { profile, refresh: refreshProfile } = useUserProfile();
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDescription, setSkillDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [customSkill, setCustomSkill] = useState("");

  useEffect(() => {
    async function fetchVolunteerProfile() {
      try {
        // Try to find this user's volunteer record
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data } = await supabase
          .from("volunteers")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (data) {
          setVolunteerData(data);
          setName(data.name || "");
          setSkills(data.skills || []);
          setSkillDescription(data.skill_description || "");
          setAvailable(data.availability ?? true);
        } else {
          // Pre-fill from profile
          setName(profile?.full_name || "");
        }
      } catch (err) {
        console.error("Failed to fetch volunteer profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVolunteerProfile();
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        name,
        skills,
        skill_description: skillDescription,
        availability: available,
      };

      if (volunteerData?.id) {
        // Update existing
        await supabase
          .from("volunteers")
          .update(payload)
          .eq("id", volunteerData.id);
      } else {
        // Insert new volunteer record
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", "default")
          .maybeSingle();

        await supabase.from("volunteers").insert({
          ...payload,
          location: { lat: 0, lng: 0, zone: "Unknown" },
          completion_rate: 0,
          avg_response_minutes: 0,
          tasks_completed: 0,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills(prev => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <Link
        href="/volunteer"
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="glass" style={{ padding: 36, borderRadius: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserCircle size={32} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Volunteer Profile
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Update your skills and availability
            </p>
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)', fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Skills */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'block' }}>
            Skills
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {SKILL_OPTIONS.map((skill) => {
              const isSelected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  style={{
                    padding: '6px 14px', borderRadius: 10,
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#a5b4fc' : 'var(--text-muted)',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected ? "✓ " : ""}{skill}
                </button>
              );
            })}
          </div>

          {/* Custom skill */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder="Add custom skill..."
              onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
              style={{
                flex: 1, padding: '8px 14px', borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)', fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={addCustomSkill}
              disabled={!customSkill.trim()}
              style={{
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc', border: 'none',
                cursor: customSkill.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Selected skills display */}
          {skills.filter(s => !SKILL_OPTIONS.includes(s)).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {skills.filter(s => !SKILL_OPTIONS.includes(s)).map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {skill}
                  <X
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSkills(prev => prev.filter(s => s !== skill))}
                  />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Skill Description */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            Skill Description
          </label>
          <textarea
            value={skillDescription}
            onChange={(e) => setSkillDescription(e.target.value)}
            placeholder="Briefly describe your experience and expertise..."
            style={{
              width: '100%', minHeight: 80, padding: '12px 16px', borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)', fontSize: 14,
              fontFamily: 'inherit', resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Availability Toggle */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            Availability
          </label>
          <button
            onClick={() => setAvailable(!available)}
            style={{
              padding: '12px 20px', borderRadius: 12,
              background: available ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${available ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: available ? '#22c55e' : '#ef4444',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: available ? '#22c55e' : '#ef4444',
              boxShadow: `0 0 8px ${available ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
            }} />
            {available ? "Available for Assignments" : "Not Available"}
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> Save Profile</>
          )}
        </button>
      </div>
    </div>
  );
}
