// client/src/pages/citizen/DisasterMapPage.tsx
import React, { useState, useEffect } from 'react';
import { DisasterLeafletMap } from '../../components/map/DisasterLeafletMap';
import api from '../../lib/api';
import { Disaster, SafeZone, EmergencyResource, IncidentReport } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { MapPin, Navigation, Info, Compass, Globe2 } from 'lucide-react';

interface RegionPreset {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

const REGION_PRESETS: RegionPreset[] = [
  { id: 'all', name: '🇮🇳 Pan-India', center: [22.3511, 78.6677], zoom: 5 },
  { id: 'north', name: '🏔️ North (NCR / Himalayas)', center: [30.2, 78.0], zoom: 7 },
  { id: 'east', name: '🌊 East & North-East', center: [24.5, 88.5], zoom: 6 },
  { id: 'west', name: '🏖️ West (Mumbai / Gujarat)', center: [20.5, 72.8], zoom: 7 },
  { id: 'south', name: '🌴 South (Kerala / TN / BLR)', center: [12.5, 77.5], zoom: 7 },
];

export const DisasterMapPage: React.FC = () => {
  const { latitude, longitude, refetchLocation, loading: geoLoading } = useGeolocation();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);

  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.3511, 78.6677]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  useEffect(() => {
    const fetchMapLayers = async () => {
      try {
        const [disastersRes, safeZonesRes, resourcesRes, reportsRes] = await Promise.all([
          api.get('/disasters'),
          api.get('/safe-zones'),
          api.get('/resources'),
          api.get('/reports?status=ALL'),
        ]);

        if (disastersRes.data?.success) setDisasters(disastersRes.data.data);
        if (safeZonesRes.data?.success) setSafeZones(safeZonesRes.data.data);
        if (resourcesRes.data?.success) setResources(resourcesRes.data.data);
        if (reportsRes.data?.success) setReports(reportsRes.data.data);
      } catch (err) {
        // Fallback directly to Supabase
        const {
          isSupabaseConfigured,
          supabaseGetDisasters,
          supabaseGetIncidentReports,
          supabaseGetSafeZones,
          supabaseGetResources,
        } = await import('../../lib/supabase');

        if (isSupabaseConfigured) {
          try {
            const [supaDisasters, supaSafeZones, supaResources, supaReports] = await Promise.all([
              supabaseGetDisasters().catch(() => []),
              supabaseGetSafeZones().catch(() => []),
              supabaseGetResources().catch(() => []),
              supabaseGetIncidentReports().catch(() => []),
            ]);

            if (supaDisasters.length) setDisasters(supaDisasters as any);
            if (supaSafeZones.length) setSafeZones(supaSafeZones as any);
            if (supaResources.length) setResources(supaResources as any);
            if (supaReports.length) setReports(supaReports as any);
            return;
          } catch (supaErr) {
            console.error('Supabase map layers fallback error:', supaErr);
          }
        }
        console.error('Failed to load map layers:', err);
      }
    };

    fetchMapLayers();
  }, []);

  const handleRegionSelect = (preset: RegionPreset) => {
    setActiveRegion(preset.id);
    setMapCenter(preset.center);
    setMapZoom(preset.zoom);
  };

  const handleCenterGPS = async () => {
    setActiveRegion('gps');
    refetchLocation();
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setMapZoom(12);
    }
  };

  // If user triggers GPS and coords arrive, center to user
  useEffect(() => {
    if (activeRegion === 'gps' && latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setMapZoom(12);
    }
  }, [latitude, longitude, activeRegion]);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4">
      {/* Title & Pan-India Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-normal text-ink flex items-center gap-2">
            <MapPin className="w-5 h-5 text-coral shrink-0" />
            <span>Interactive Situational GIS Map</span>
            <span className="hidden sm:inline-block text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-coral-subtle text-coral border border-coral-border">
              Pan-India
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Real-time geospatial visualization of active hazard perimeters, evacuation shelters, medical/NDRF bases, and citizen reports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => handleRegionSelect(REGION_PRESETS[0])}
            className={`flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition border ${
              activeRegion === 'all'
                ? 'bg-coral-subtle text-coral border-coral shadow-xs'
                : 'bg-white hover:bg-canvas text-ink border-hairline shadow-card'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>All India</span>
          </button>

          <button
            onClick={handleCenterGPS}
            disabled={geoLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition border ${
              activeRegion === 'gps'
                ? 'bg-coral-subtle text-coral border-coral shadow-xs'
                : 'bg-white hover:bg-canvas text-ink border-hairline shadow-card'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 text-coral ${geoLoading ? 'animate-spin' : ''}`} />
            <span>{geoLoading ? 'Acquiring...' : 'My GPS'}</span>
          </button>
        </div>
      </div>

      {/* Regional Quick Navigation Ribbon (Smooth horizontal scrolling on mobile) */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1 flex-shrink-0 pl-1">
          <Compass className="w-3.5 h-3.5 text-coral" />
          Region:
        </span>
        {REGION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleRegionSelect(preset)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition border ${
              activeRegion === preset.id
                ? 'bg-ink text-white border-ink font-semibold shadow-xs'
                : 'bg-white hover:bg-canvas text-ink border-hairline shadow-card'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Full-width Map Container with viewport-aware mobile height */}
      <DisasterLeafletMap
        disasters={disasters}
        safeZones={safeZones}
        resources={resources}
        reports={reports}
        userLat={latitude}
        userLng={longitude}
        height="min(70vh, 680px)"
        center={mapCenter}
        zoom={mapZoom}
        onResetPanIndia={() => handleRegionSelect(REGION_PRESETS[0])}
      />

      {/* Bottom Info Bar with Live Totals across India */}
      <div className="bg-white border border-hairline p-4 rounded-xl flex flex-wrap items-center justify-between text-xs text-ink-muted gap-4 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C64545]" />
            Active Disasters & Buffers ({disasters.length})
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            Verified Safe Shelters ({safeZones.length})
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            Medical & NDRF Units ({resources.length})
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            Citizen Eyewitness Reports ({reports.length})
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px] text-ink-subtle">
          <Info className="w-3.5 h-3.5 text-ink-subtle" />
          <span>Pan-India WGS-84 Coordinate Standard • OpenStreetMap Cartography</span>
        </div>
      </div>
    </div>
  );
};
