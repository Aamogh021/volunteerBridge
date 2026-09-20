/**
 * CrisisMap — Google Maps component with urgency-colored need markers.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { CommunityNeed } from "@/types";

interface CrisisMapProps {
  needs: CommunityNeed[];
  onMarkerClick?: (need: CommunityNeed) => void;
}

function getMarkerColor(urgencyScore: number): string {
  if (urgencyScore >= 8) return "#E24B4A";
  if (urgencyScore >= 5) return "#EF9F27";
  return "#1D9E75";
}

function createMarkerElement(urgencyScore: number, status: string): HTMLDivElement {
  const el = document.createElement("div");
  const color = getMarkerColor(urgencyScore);
  const opacity = status === "unassigned" ? 1 : 0.6;
  el.style.cssText = `
    width: 28px;
    height: 28px;
    background-color: ${color};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: transform 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: white;
    opacity: ${opacity};
  `;
  el.textContent = String(urgencyScore);
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.3)";
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)";
  });
  return el;
}

export default function CrisisMap({
  needs,
  onMarkerClick,
}: CrisisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initMap = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "") {
      setError("Google Maps API key not configured.");
      setLoading(false);
      return;
    }

    try {
      const loader = new Loader({
        apiKey,
        version: "weekly",
      });

      const google = await loader.load();

      if (!mapRef.current) return;

      const mapOptions: google.maps.MapOptions = {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }],
          },
        ],
      };

      // Only add mapId if it's explicitly created in console; 
      // fallback to standard markers if not.
      if (apiKey !== "YOUR_KEY_HERE") {
        // mapOptions.mapId = "volunteerbridge-crisis-map"; 
      }

      const map = new google.maps.Map(mapRef.current, mapOptions);

      mapInstanceRef.current = map;
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Google Maps";
      setError(message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const newMarkers: google.maps.Marker[] = [];

    needs.forEach((need) => {
      if (!need.location?.lat || !need.location?.lng) return;

      const marker = new google.maps.Marker({
        map,
        position: { lat: need.location.lat, lng: need.location.lng },
        title: `${need.need_type} - Urgency: ${need.urgency_score}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: getMarkerColor(need.urgency_score),
          fillOpacity: need.status === "unassigned" ? 1 : 0.6,
          strokeWeight: 3,
          strokeColor: "#FFFFFF",
          scale: 15,
        },
        label: {
          text: String(need.urgency_score),
          color: "#FFFFFF",
          fontSize: "10px",
          fontWeight: "800",
        },
      });

      marker.addListener("click", () => {
        onMarkerClick?.(need);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers as any;

    if (newMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: newMarkers,
      });
    }

    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      needs.forEach((need) => {
        if (need.location?.lat && need.location?.lng) {
          bounds.extend({ lat: need.location.lat, lng: need.location.lng });
        }
      });
      map.fitBounds(bounds, 50);
    }
  }, [needs, onMarkerClick]);

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '500px',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Notice Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '12px 16px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }} />
            <span style={{ fontSize: '13px', color: '#fef08a', fontWeight: 600 }}>
              Spatial Grid View (Google Maps Key Unconfigured)
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Showing {needs.length} Active Crisis Points
          </span>
        </div>

        {/* Spatial Grid Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            maxHeight: '420px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {needs.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No active crisis needs reported.
            </div>
          ) : (
            needs.map((need) => {
              const color = getMarkerColor(need.urgency_score);
              return (
                <div
                  key={need.id}
                  onClick={() => onMarkerClick?.(need)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {need.need_type || "Emergency Need"}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: color,
                        color: 'white',
                      }}
                    >
                      Urgency: {need.urgency_score}/10
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    Zone: {need.location?.zone || "Unknown Zone"} • {need.volunteer_hours_needed} hrs needed
                  </p>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(need.required_skills || []).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#a5b4fc',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div 
          className="flex items-center justify-center"
          style={{ position: 'absolute', inset: 0, backgroundColor: '#F8FAFC', zIndex: 10 }}
        >
          <div className="animate-spin" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: '#185FA5' }} />
          <span style={{ marginLeft: '12px', color: '#1A202C', fontSize: '14px', fontWeight: 500 }}>Loading map...</span>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '500px', backgroundColor: '#E2E8F0' }} />

      {/* Legend */}
      <div 
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          borderRadius: '8px',
          padding: '12px',
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1A202C', marginBottom: '8px' }}>Urgency</p>
        <div className="flex flex-col" style={{ gap: '6px' }}>
          <div className="flex flex-row items-center" style={{ gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#E24B4A' }} />
            <span style={{ fontSize: '12px', color: '#64748B' }}>Critical (8-10)</span>
          </div>
          <div className="flex flex-row items-center" style={{ gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF9F27' }} />
            <span style={{ fontSize: '12px', color: '#64748B' }}>Moderate (5-7)</span>
          </div>
          <div className="flex flex-row items-center" style={{ gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1D9E75' }} />
            <span style={{ fontSize: '12px', color: '#64748B' }}>Low (1-4)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
