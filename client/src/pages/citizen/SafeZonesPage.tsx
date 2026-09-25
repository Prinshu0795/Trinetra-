// client/src/pages/citizen/SafeZonesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Navigation,
  Phone,
  AlertTriangle,
  Globe,
  Radio,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import api from '../../lib/api';
import { SafeZone } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useGeolocation } from '../../hooks/useGeolocation';
import { supabase, isSupabaseConfigured, supabaseGetSafeZones } from '../../lib/supabase';

const DEFAULT_COORDS = [
  { name: 'Guwahati (AS)', lat: 26.1445, lng: 91.7362 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  { name: 'Mumbai (MH)', lat: 19.076, lng: 72.8777 },
  { name: 'Bengaluru (KA)', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai (TN)', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata (WB)', lat: 22.5726, lng: 88.3639 },
  { name: 'Lucknow (UP)', lat: 26.8467, lng: 80.9462 },
  { name: 'Chamoli (UK)', lat: 30.5562, lng: 79.567 },
  { name: 'Wayanad (KL)', lat: 11.5534, lng: 76.132 },
];

export const SafeZonesPage: React.FC = () => {
  const { latitude, longitude, loading: geoLoading, refetchLocation } = useGeolocation();
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [liveMode, setLiveMode] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<{ verifiedCount: number; osmCount: number; cached: boolean }>({
    verifiedCount: 0,
    osmCount: 0,
    cached: false,
  });
  const [filterType, setFilterType] = useState<'ALL' | 'VERIFIED' | 'OSM'>('ALL');

  // Determine effective coordinates: user's GPS or chosen fallback
  const effectiveLat = selectedCoords?.lat ?? latitude ?? 26.1445;
  const effectiveLng = selectedCoords?.lng ?? longitude ?? 91.7362;

  const fetchShelters = async (lat: number, lng: number, forceLive: boolean) => {
    try {
      setLoading(true);
      let loadedShelters: SafeZone[] = [];

      // 1. Fetch live safe zones from Supabase directly
      if (isSupabaseConfigured) {
        try {
          const supaShelters = await supabaseGetSafeZones();
          if (supaShelters?.length) {
            loadedShelters = supaShelters as any;
            setTelemetry((prev) => ({
              ...prev,
              verifiedCount: supaShelters.length,
            }));
          }
        } catch (supaErr) {
          console.warn('Direct Supabase shelter fetch warning:', supaErr);
        }
      }

      // 2. Fetch instant/OSM dynamic shelters
      try {
        const res = await api.get(
          `/safe-zones/instant?lat=${lat}&lng=${lng}&radiusKm=35&live=${forceLive}`
        );
        if (res.data?.success) {
          const instantShelters: SafeZone[] = res.data.data.shelters || [];
          // Combine Supabase verified shelters with OSM shelters
          const combined = [...loadedShelters];
          for (const s of instantShelters) {
            if (!combined.some((c) => c.name.toLowerCase() === s.name.toLowerCase())) {
              combined.push(s);
            }
          }
          loadedShelters = combined;
          setTelemetry({
            verifiedCount: res.data.data.verifiedCount || loadedShelters.length,
            osmCount: res.data.data.osmCount || 0,
            cached: res.data.data.cached || false,
          });
        }
      } catch (err) {
        console.warn('Instant shelter route fallback notice:', err);
      }

      setSafeZones(loadedShelters);
    } catch (err) {
      console.error('All shelter routes failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters(effectiveLat, effectiveLng, liveMode);

    // Live Realtime Subscription for safe zones
    const szChannel = supabase
      .channel('safe-zones-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safe_zones' }, () => {
        fetchShelters(effectiveLat, effectiveLng, liveMode);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(szChannel);
    };
  }, [effectiveLat, effectiveLng, liveMode]);

  const filteredSafeZones = safeZones.filter((sz) => {
    if (filterType === 'VERIFIED') return sz.source === 'TRINETRA_VERIFIED' || sz.source?.includes('District');
    if (filterType === 'OSM') return sz.source === 'OPENSTREETMAP';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-normal text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#166534] shrink-0" />
            <span>Instant Evacuation Shelters & Safe Zones</span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Real-time geospatial discovery of government-verified relief camps and live crowdsourced OpenStreetMap emergency muster points.
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => {
              setSelectedCoords(null);
              refetchLocation();
            }}
            disabled={geoLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 bg-white hover:bg-canvas text-ink border border-hairline rounded-xl text-xs font-semibold shadow-card transition"
          >
            <Navigation className={`w-3.5 h-3.5 text-coral ${geoLoading ? 'animate-spin' : ''}`} />
            <span>{geoLoading ? 'Acquiring...' : 'My Location'}</span>
          </button>

          <button
            onClick={() => fetchShelters(effectiveLat, effectiveLng, true)}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 bg-white hover:bg-canvas text-coral border border-hairline rounded-xl text-xs font-semibold shadow-card transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Location Presets & Filter Toggles */}
      <div className="bg-white border border-hairline p-3 sm:p-4 rounded-2xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-mono text-ink-muted flex items-center gap-1 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-ink-subtle" />
            <span>Sector:</span>
          </span>
          {DEFAULT_COORDS.map((city) => {
            const isSelected = selectedCoords?.lat === city.lat && selectedCoords?.lng === city.lng;
            return (
              <button
                key={city.name}
                onClick={() => setSelectedCoords({ lat: city.lat, lng: city.lng })}
                className={`text-xs px-2.5 py-1 rounded-lg border font-mono whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-[#CC785C] text-white border-[#CC785C]'
                    : 'bg-canvas text-ink-body border-hairline hover:border-coral'
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center space-x-1 bg-canvas p-1 rounded-xl border border-hairline overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`text-xs px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'ALL' ? 'bg-white shadow-sm text-ink font-semibold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            All ({safeZones.length})
          </button>
          <button
            onClick={() => setFilterType('VERIFIED')}
            className={`text-xs px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'VERIFIED' ? 'bg-white shadow-sm text-[#166534] font-semibold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Verified ({telemetry.verifiedCount})
          </button>
          <button
            onClick={() => setFilterType('OSM')}
            className={`text-xs px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 'OSM' ? 'bg-white shadow-sm text-[#1E40AF] font-semibold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            OSM ({telemetry.osmCount})
          </button>
        </div>
      </div>

      {/* Dynamic Telemetry Banner */}
      <div className="bg-[#FAF9F5] border border-hairline px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between text-xs text-ink-muted font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-ink-body font-semibold">
            <Radio className="w-3.5 h-3.5 text-coral animate-pulse" />
            <span>Search Radius: 35 km</span>
          </span>
          <span>•</span>
          <span>GPS: {effectiveLat.toFixed(4)}°N, {effectiveLng.toFixed(4)}°E</span>
          <span>•</span>
          <span className="text-[#166534]">🛡️ {telemetry.verifiedCount} Govt Verified</span>
          <span>•</span>
          <span className="text-[#1E40AF]">🌐 {telemetry.osmCount} Live OSM</span>
        </div>
        {telemetry.cached && (
          <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-hairline text-ink-subtle">
            ⚡ In-Memory Geospatial Cache
          </span>
        )}
      </div>

      {/* Shelter Grid */}
      {loading ? (
        <div className="p-12 text-center text-ink-muted text-xs font-mono space-y-2">
          <RefreshCw className="w-5 h-5 mx-auto animate-spin text-coral" />
          <p>Scanning 35km radius via TRINETRA Registry & OpenStreetMap Overpass...</p>
        </div>
      ) : filteredSafeZones.length === 0 ? (
        <div className="bg-white border border-hairline rounded-2xl p-8 sm:p-12 text-center shadow-card space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-canvas border border-hairline flex items-center justify-center mx-auto text-ink-subtle">
            <ShieldCheck className="w-6 h-6 text-ink-subtle" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-ink">No Shelters Found in this Sector</h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              No registered relief shelters or designated muster points were detected within 35 km.
            </p>
          </div>
          <div className="p-4 bg-canvas border border-hairline rounded-xl text-left space-y-2 text-xs font-mono">
            <div className="font-semibold text-ink uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
              <span>National Life-Safety Protocol</span>
            </div>
            <ul className="space-y-1 text-ink-body pt-1">
              <li>• National Emergency Helpline: <strong className="text-ink font-semibold">112</strong></li>
              <li>• State Disaster Control Room / NDRF: <strong className="text-ink font-semibold">1070</strong></li>
              <li>• Medical Dispatch: <strong className="text-ink font-semibold">108</strong></li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSafeZones.map((sz) => {
            const isOSM = sz.source === 'OPENSTREETMAP';
            const occupancyPct =
              sz.occupancyPercentage ??
              (sz.capacityTotal > 0 ? Math.round((sz.capacityOccupied / sz.capacityTotal) * 100) : 0);

            let amenitiesList: string[] = [];
            if (Array.isArray(sz.amenities)) {
              amenitiesList = sz.amenities;
            } else if (sz.amenities) {
              try {
                const parsed = JSON.parse(sz.amenities);
                if (Array.isArray(parsed)) amenitiesList = parsed;
              } catch {
                amenitiesList = [];
              }
            }

            return (
              <div
                key={sz.id}
                className="bg-white border border-hairline rounded-xl p-5 shadow-card hover:border-hairline transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header & Source Tag */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isOSM
                              ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                              : 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                          }`}
                        >
                          {isOSM ? '🌐 OpenStreetMap' : '🛡️ Govt Verified'}
                        </span>
                        <span className="text-[10px] font-mono text-ink-muted uppercase">
                          {sz.type}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-ink leading-tight mt-1">{sz.name}</h3>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
                        <span className="truncate">{sz.locationName}</span>
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
                        📍 {sz.distanceKm.toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  {/* Live Capacity Meter */}
                  <div className="space-y-1.5 pt-2 border-t border-hairline">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-ink-muted">
                        {isOSM ? 'Estimated Capacity' : 'Occupancy Meter'}
                      </span>
                      <span
                        className={
                          occupancyPct > 85
                            ? 'text-[#9E2A2B] font-semibold'
                            : 'text-[#166534] font-semibold'
                        }
                      >
                        {isOSM
                          ? `~${sz.capacityTotal} persons`
                          : `${sz.capacityOccupied} / ${sz.capacityTotal} (${occupancyPct}%)`}
                      </span>
                    </div>
                    {!isOSM && (
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
                    )}
                  </div>

                  {/* Amenities Tags */}
                  {amenitiesList.length > 0 && (
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
                  )}
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
                    <span className="text-[11px] text-ink-subtle font-mono">
                      {isOSM ? 'Public Open Facility' : 'No direct line'}
                    </span>
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
