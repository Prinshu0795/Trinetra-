// client/src/pages/citizen/DisasterMapPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DisasterLeafletMap } from '../../components/map/DisasterLeafletMap';
import api from '../../lib/api';
import { Disaster, SafeZone, EmergencyResource, IncidentReport } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import {
  MapPin,
  Navigation,
  Info,
  Compass,
  Globe2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
  X,
  Loader2,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import {
  supabase,
  isSupabaseConfigured,
  supabaseGetDisasters,
  supabaseGetIncidentReports,
  supabaseGetSafeZones,
  supabaseGetResources,
} from '../../lib/supabase';

interface RegionPreset {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

const REGION_PRESETS: RegionPreset[] = [
  { id: 'all', name: '🇮🇳 Whole India (Pan-India)', center: [22.3511, 78.6677], zoom: 5 },
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
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Geo Location Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [searchedLocation, setSearchedLocation] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [syncingFeeds, setSyncingFeeds] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ message: string; success: boolean } | null>(null);

  const fetchMapLayers = async () => {
    try {
      // 1. Fetch live GIS layers from Supabase directly
      let supaDisasters: any[] = [];
      let supaSafeZones: any[] = [];
      let supaResources: any[] = [];
      let supaReports: any[] = [];

      if (isSupabaseConfigured) {
        try {
          [supaDisasters, supaSafeZones, supaResources, supaReports] = await Promise.all([
            supabaseGetDisasters().catch(() => []),
            supabaseGetSafeZones().catch(() => []),
            supabaseGetResources().catch(() => []),
            supabaseGetIncidentReports().catch(() => []),
          ]);
        } catch (supaErr) {
          console.warn('Direct Supabase map layers notice:', supaErr);
        }
      }

      // 2. Fetch/Enrich from Express backend
      let backendDisasters: any[] = [];
      let backendSafeZones: any[] = [];
      let backendResources: any[] = [];
      let backendReports: any[] = [];

      try {
        const [disastersRes, safeZonesRes, resourcesRes, reportsRes] = await Promise.all([
          api.get('/disasters').catch(() => null),
          api.get('/safe-zones').catch(() => null),
          api.get('/resources').catch(() => null),
          api.get('/reports?status=ALL').catch(() => null),
        ]);

        if (disastersRes?.data?.success) backendDisasters = disastersRes.data.data || [];
        if (safeZonesRes?.data?.success) backendSafeZones = safeZonesRes.data.data || [];
        if (resourcesRes?.data?.success) backendResources = resourcesRes.data.data || [];
        if (reportsRes?.data?.success) backendReports = reportsRes.data.data || [];
      } catch (backendErr) {
        console.warn('Backend map layers fallback notice:', backendErr);
      }

      // Helper to merge and deduplicate records by normalized identifier
      const mergeBy = (listA: any[], listB: any[], keyFn: (item: any) => string) => {
        const map = new Map<string, any>();
        for (const item of listA) {
          const k = keyFn(item);
          if (k) map.set(k, item);
        }
        for (const item of listB) {
          const k = keyFn(item);
          if (k) {
            const existing = map.get(k);
            map.set(k, existing ? { ...existing, ...item } : item);
          }
        }
        return Array.from(map.values());
      };

      const mergedDisasters = mergeBy(
        backendDisasters,
        supaDisasters,
        (d) => (d.title || d.id || '').toLowerCase().trim()
      );
      const mergedSafeZones = mergeBy(
        backendSafeZones,
        supaSafeZones,
        (s) => (s.name || s.id || '').toLowerCase().trim()
      );
      const mergedResources = mergeBy(
        backendResources,
        supaResources,
        (r) => (r.name || r.id || '').toLowerCase().trim()
      );
      const mergedReports = mergeBy(
        backendReports,
        supaReports,
        (r) => (r.trackingCode || r.tracking_code || r.id || '').toLowerCase().trim()
      );

      setDisasters(mergedDisasters);
      setSafeZones(mergedSafeZones);
      setResources(mergedResources);
      setReports(mergedReports);
    } catch (err) {
      console.error('Failed to load map layers:', err);
    }
  };

  useEffect(() => {
    fetchMapLayers();

    // Live Realtime Subscriptions for Map layers
    const mapChannel = supabase
      .channel('disaster-map-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disasters' }, () => {
        supabaseGetDisasters().then((d) => {
          setDisasters((prev) => {
            const map = new Map<string, any>(prev.map((item) => [(item.title || item.id).toLowerCase(), item]));
            d.forEach((item: any) => map.set((item.title || item.id).toLowerCase(), item));
            return Array.from(map.values());
          });
        }).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_reports' }, () => {
        supabaseGetIncidentReports().then((r) => {
          setReports((prev) => {
            const map = new Map<string, any>(prev.map((item) => [(item.trackingCode || item.id).toLowerCase(), item]));
            r.forEach((item: any) => map.set((item.trackingCode || item.id).toLowerCase(), item));
            return Array.from(map.values());
          });
        }).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safe_zones' }, () => {
        supabaseGetSafeZones().then((s) => {
          setSafeZones((prev) => {
            const map = new Map<string, any>(prev.map((item) => [(item.name || item.id).toLowerCase(), item]));
            s.forEach((item: any) => map.set((item.name || item.id).toLowerCase(), item));
            return Array.from(map.values());
          });
        }).catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(mapChannel);
    };
  }, []);

  const handleSyncLiveFeeds = async () => {
    try {
      setSyncingFeeds(true);
      const res = await api.post('/disasters/sync-live');
      if (res.data?.success) {
        const report = res.data.data.report;
        setSyncNotice({
          message: `Live telemetry synced: +${report?.totalSynced || 0} events from USGS, GDACS & NASA.`,
          success: true,
        });
        await fetchMapLayers();
      }
    } catch (err: any) {
      setSyncNotice({
        message: err.response?.data?.message || 'Sync error. Reconnected to national cache.',
        success: false,
      });
    } finally {
      setSyncingFeeds(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  const handleRegionSelect = (preset: RegionPreset) => {
    setActiveRegion(preset.id);
    setMapCenter(preset.center);
    setMapZoom(preset.zoom);
    setSearchedLocation(null);
  };

  const handleCenterGPS = async () => {
    setActiveRegion('gps');
    setSearchedLocation(null);
    refetchLocation();
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setMapZoom(11);
    }
  };

  // If user triggers GPS and coords arrive, center to user
  useEffect(() => {
    if (activeRegion === 'gps' && latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setMapZoom(11);
    }
  }, [latitude, longitude, activeRegion]);

  // Geo Location Search Handlers
  const handleMapSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/geo-intelligence/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const features = res.data?.data?.features || [];
      setSearchSuggestions(features);
      if (features.length > 0) {
        selectSearchedLocation(features[0]);
      }
    } catch (err) {
      console.error('Geo search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchedLocation = (feature: any) => {
    const lng = feature.geometry?.coordinates?.[0] || feature.properties?.coordinates?.longitude;
    const lat = feature.geometry?.coordinates?.[1] || feature.properties?.coordinates?.latitude;
    const name = feature.properties?.name || feature.place_name || feature.text || searchQuery;
    const address = feature.properties?.full_address || feature.place_name || '';

    const numLat = Number(lat);
    const numLng = Number(lng);

    if (!isNaN(numLat) && !isNaN(numLng)) {
      setSearchedLocation({ name, address, lat: numLat, lng: numLng });
      setActiveRegion('custom-search');
      setMapCenter([numLat, numLng]);
      setMapZoom(12);
      setSearchSuggestions([]);
      setSearchQuery(name);
    }
  };

  const clearSearch = () => {
    setSearchedLocation(null);
    setSearchQuery('');
    setSearchSuggestions([]);
    handleRegionSelect(REGION_PRESETS[0]);
  };

  const filteredDisasters = disasters.filter((d) => {
    if (typeFilter === 'ALL') return true;
    return d.type?.toUpperCase() === typeFilter.toUpperCase();
  });

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
            Real-time geospatial visualization of active hazard perimeters, evacuation shelters, medical/NDRF bases, and citizen reports across all Indian states.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleSyncLiveFeeds}
            disabled={syncingFeeds}
            title="Poll real-time feeds from USGS Earthquakes, GDACS & NASA EONET"
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition border bg-coral hover:bg-coral-hover text-white shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingFeeds ? 'animate-spin' : ''}`} />
            <span>{syncingFeeds ? 'Syncing...' : 'Sync Live Feeds'}</span>
          </button>

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

      {/* Sync Status Banner */}
      {syncNotice && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
            syncNotice.success
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncNotice.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#166534]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#991B1B]" />
            )}
            <span className="font-medium">{syncNotice.message}</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">Auto-Refreshed</span>
        </div>
      )}

      {/* GEOSPATIAL SEARCH BAR WITH PROMINENT SEARCH BUTTON */}
      <div className="bg-white p-3.5 rounded-2xl border border-hairline shadow-card">
        <form onSubmit={handleMapSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search any city, district, village or landmark in India (e.g., Guwahati, Mumbai, Chamoli, Delhi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas/60 border border-hairline rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition shadow-inner"
            />
            <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-3 text-ink-subtle hover:text-ink transition"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {searching && (
              <Loader2 className="w-4 h-4 text-coral animate-spin absolute right-9 top-3" />
            )}

            {/* Suggestions Dropdown */}
            {searchSuggestions.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-hairline rounded-xl shadow-2xl z-[1500] max-h-60 overflow-y-auto divide-y divide-hairline">
                {searchSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSearchedLocation(s)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-canvas-subtle flex items-start gap-2.5 transition text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-coral mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">
                        {s.properties?.name || s.place_name || s.text}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate">
                        {s.properties?.full_address || s.place_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Prominent Search Button */}
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-coral hover:bg-coral-hover disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial"
              title="Search Location on Map"
            >
              <Search className="w-4 h-4" />
              <span>{searching ? 'Locating...' : 'Search Map'}</span>
            </button>

            {/* Direct Link to Geo-Intelligence Risk Model */}
            <Link
              to="/geo-intelligence"
              className="px-3.5 py-2.5 rounded-xl border border-hairline bg-canvas/40 hover:bg-coral-subtle hover:text-coral hover:border-coral text-ink text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Open full AI Geo-Intelligence Risk Assessment & Terrain Models"
            >
              <Activity className="w-3.5 h-3.5 text-coral" />
              <span className="hidden md:inline">Geo-Intelligence Hub</span>
              <ExternalLink className="w-3 h-3 text-ink-subtle" />
            </Link>
          </div>
        </form>

        {/* Active Searched Location HUD Banner */}
        {searchedLocation && (
          <div className="mt-2.5 pt-2.5 border-t border-hairline/60 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold font-mono text-[11px]">
                🎯 Focused on: {searchedLocation.name}
              </span>
              <span className="text-[11px] text-ink-muted hidden sm:inline">
                ({searchedLocation.lat.toFixed(4)}°N, {searchedLocation.lng.toFixed(4)}°E)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/geo-intelligence`}
                className="text-xs text-coral hover:underline font-semibold flex items-center gap-1"
              >
                <span>Run Full Risk Model</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={clearSearch}
                className="text-[11px] text-ink-subtle hover:text-ink font-medium px-2 py-0.5 rounded border border-hairline hover:bg-canvas"
              >
                Reset to Pan-India
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Ribbon: Region Selector & Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-hairline shadow-card">
        {/* Regional Quick Navigation Ribbon */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1 flex-shrink-0 pl-1">
            <Compass className="w-3.5 h-3.5 text-coral" />
            Sector:
          </span>
          {REGION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleRegionSelect(preset)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition border ${
                activeRegion === preset.id
                  ? 'bg-ink text-white border-ink font-semibold shadow-xs'
                  : 'bg-canvas hover:bg-canvas-subtle text-ink border-hairline'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Hazard Category Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar text-xs">
          {['ALL', 'FLOOD', 'CYCLONE', 'LANDSLIDE', 'URBAN_EMERGENCY'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition whitespace-nowrap ${
                typeFilter === type
                  ? 'bg-coral-subtle text-coral border-coral font-bold shadow-xs'
                  : 'bg-white hover:bg-canvas text-ink-muted border-hairline'
              }`}
            >
              {type === 'ALL' ? `All Types (${disasters.length})` : type}
            </button>
          ))}
        </div>
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
        fitPanIndia={activeRegion === 'all'}
        typeFilter={typeFilter}
        searchedLocation={searchedLocation}
        onResetPanIndia={() => handleRegionSelect(REGION_PRESETS[0])}
      />

      {/* Bottom Info Bar with Live Totals across India */}
      <div className="bg-white border border-hairline p-4 rounded-xl flex flex-wrap items-center justify-between text-xs text-ink-muted gap-4 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C64545]" />
            Active Hazards ({disasters.length})
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
          <span>Pan-India WGS-84 Coordinate Standard • Live USGS / GDACS / NASA Feeds</span>
        </div>
      </div>

      {/* Pan-India Hazard Sectors Quick-Nav Grid */}
      <div className="bg-white border border-hairline p-5 rounded-2xl shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <span>🇮🇳</span>
            <span>All Pan-India Operational Hazard Sectors ({filteredDisasters.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-ink-muted">Click any sector to focus map</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredDisasters.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setActiveRegion(d.id);
                setMapCenter([d.latitude, d.longitude]);
                setMapZoom(9);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              className="text-left p-3 rounded-xl border border-hairline hover:border-coral bg-canvas/40 hover:bg-coral-subtle/30 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-coral bg-coral-subtle px-1.5 py-0.5 rounded">
                    {d.type}
                  </span>
                  <Badge severity={d.severity} />
                </div>
                <h4 className="text-xs font-semibold text-ink group-hover:text-coral transition line-clamp-1">
                  {d.title}
                </h4>
                <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                  📍 {d.locationName}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-subtle pt-2 mt-2 border-t border-hairline/60">
                <span>Radius: {d.radiusKm} km</span>
                <span className="flex items-center text-coral font-medium">
                  Focus <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
