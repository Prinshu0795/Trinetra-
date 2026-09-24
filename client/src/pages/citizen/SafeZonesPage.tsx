// client/src/pages/citizen/SafeZonesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';
import api from '../../lib/api';
import { SafeZone } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useGeolocation } from '../../hooks/useGeolocation';

export const SafeZonesPage: React.FC = () => {
  const { latitude, longitude } = useGeolocation();
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSafeZones = async () => {
      try {
        setLoading(true);
        const latQuery = latitude ? `?lat=${latitude}&lng=${longitude}` : '';
        const res = await api.get(`/safe-zones${latQuery}`);
        if (res.data.success) {
          setSafeZones(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load safe zones:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSafeZones();
  }, [latitude, longitude]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-normal text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#166534]" />
          <span>Designated Safe Zones & Relief Shelters</span>
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Government-verified high-ground evacuation shelters equipped with emergency power, medical triage, and clean drinking water.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-ink-muted">Loading shelter capacity telemetry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeZones.map((sz) => {
            const occupancyRatio = sz.capacityTotal > 0 ? sz.capacityOccupied / sz.capacityTotal : 0;
            const occupancyPct = Math.round(occupancyRatio * 100);
            let amenitiesList: string[] = [];
            try {
              amenitiesList = JSON.parse(sz.amenities);
            } catch {
              amenitiesList = ['Emergency Shelter', 'First Aid'];
            }

            return (
              <div
                key={sz.id}
                className="bg-white border border-hairline rounded-xl p-5 shadow-card hover:border-hairline transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-semibold text-[#166534] uppercase tracking-wider">
                        {sz.type}
                      </span>
                      <h3 className="text-base font-semibold text-ink leading-tight mt-0.5">{sz.name}</h3>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
                        <span>{sz.locationName}</span>
                      </p>
                    </div>
                    <Badge status={sz.status} />
                  </div>

                  {/* Elevation & Distance */}
                  <div className="flex items-center space-x-2 text-xs text-ink-muted font-mono">
                    {sz.elevationMeters && (
                      <span className="bg-canvas px-2 py-0.5 rounded text-ink-body border border-hairline">
                        ⛰️ {sz.elevationMeters}m MSL
                      </span>
                    )}
                    {sz.distanceKm !== undefined && (
                      <span className="bg-canvas px-2 py-0.5 rounded text-[#1E40AF] font-semibold border border-hairline">
                        📍 {sz.distanceKm} km away
                      </span>
                    )}
                  </div>

                  {/* Live Capacity Meter */}
                  <div className="space-y-1.5 pt-2 border-t border-hairline">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-ink-muted">Occupancy Meter</span>
                      <span className={occupancyPct > 85 ? 'text-[#9E2A2B] font-semibold' : 'text-[#166534] font-semibold'}>
                        {sz.capacityOccupied} / {sz.capacityTotal} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-canvas-muted h-2 rounded-full overflow-hidden border border-hairline">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancyPct > 85
                            ? 'bg-[#9E2A2B]'
                            : occupancyPct > 60
                            ? 'bg-[#D97706]'
                            : 'bg-[#166534]'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {amenitiesList.map((amenity, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-canvas border border-hairline text-ink-body px-2 py-0.5 rounded-md"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-hairline flex items-center justify-between">
                  {sz.contactPhone ? (
                    <a
                      href={`tel:${sz.contactPhone}`}
                      className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 font-mono"
                    >
                      <Phone className="w-3.5 h-3.5 text-ink-subtle" />
                      <span>{sz.contactPhone}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-ink-subtle">24x7 Staffed</span>
                  )}

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${sz.latitude},${sz.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-canvas text-coral border border-hairline rounded-lg text-xs font-semibold shadow-card transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
