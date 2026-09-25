// client/src/pages/citizen/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  FilePlus2,
  Bell,
  ArrowRight,
  TrendingUp,
  Activity,
  Compass,
  AlertTriangle,
  PhoneCall,
  Waves,
  ExternalLink,
  Layers,
  CheckCircle2,
  Clock,
  Navigation,
  AlertOctagon,
} from 'lucide-react';
import api from '../../lib/api';
import { Disaster, SafeZone, Alert, IncidentReport, RiskAssessment, EmergencyResource } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useGeolocation } from '../../hooks/useGeolocation';
import { DisasterLeafletMap } from '../../components/map/DisasterLeafletMap';
import { EmergencySosModal } from '../../components/relay/EmergencySosModal';

const HOME_REGION_PRESETS = [
  { id: 'all', name: '🇮🇳 Whole India', center: [22.3511, 78.6677] as [number, number], zoom: 5 },
  { id: 'north', name: '🏔️ North', center: [29.8, 78.2] as [number, number], zoom: 7 },
  { id: 'east', name: '🌊 East & NE', center: [24.5, 88.5] as [number, number], zoom: 6 },
  { id: 'west', name: '🏖️ West', center: [20.5, 72.8] as [number, number], zoom: 7 },
  { id: 'south', name: '🌴 South', center: [12.5, 77.5] as [number, number], zoom: 7 },
];

export const HomePage: React.FC = () => {
  const { latitude, longitude, refetchLocation, loading: geoLoading } = useGeolocation();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [riskData, setRiskData] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sosModalOpen, setSosModalOpen] = useState<boolean>(false);

  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.3511, 78.6677]);
  const [mapZoom, setMapZoom] = useState<number>(5);
  const [disasterTypeFilter, setDisasterTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchHomeTelemetry = async () => {
      try {
        setLoading(true);
        const latQuery = latitude ? `?lat=${latitude}&lng=${longitude}` : '';

        const [disastersRes, safeZonesRes, resourcesRes, alertsRes, reportsRes] = await Promise.all([
          api.get(`/disasters${latQuery}`),
          api.get('/safe-zones'),
          api.get('/resources'),
          api.get('/alerts?status=ACTIVE'),
          api.get('/reports?status=ALL'),
        ]);

        let loadedDisasters: Disaster[] = [];
        if (disastersRes.data?.success) {
          loadedDisasters = disastersRes.data.data;
          setDisasters(loadedDisasters);
        }
        if (safeZonesRes.data?.success) setSafeZones(safeZonesRes.data.data);
        if (resourcesRes.data?.success) setResources(resourcesRes.data.data);
        if (alertsRes.data?.success) setAlerts(alertsRes.data.data);
        if (reportsRes.data?.success) setReports(reportsRes.data.data);

        // Dynamic risk query based on nearest disaster sector or coordinates
        const primarySector = loadedDisasters[0]?.locationName || 'Guwahati';
        try {
          const riskRes = await api.get(`/risk/${encodeURIComponent(primarySector)}${latQuery}`);
          if (riskRes.data?.success) setRiskData(riskRes.data.data);
        } catch (riskErr) {
          console.warn('Risk query error:', riskErr);
        }
      } catch (err) {
        console.error('Failed to load home page telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeTelemetry();
  }, [latitude, longitude]);

  const activeDisaster = disasters[0];
  const urgentAlert = alerts[0];
  const totalShelterCapacity = safeZones.reduce((sum, sz) => sum + sz.capacityTotal, 0);
  const totalShelterOccupied = safeZones.reduce((sum, sz) => sum + sz.capacityOccupied, 0);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12 font-sans">
      {/* 1. EDITORIAL HERO: Calm, Authoritative Public Safety Dispatch */}
      <section className="space-y-4 sm:space-y-6 max-w-4xl">
        {/* Eyebrow & Provenance Kicker */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-subtle border border-coral-border text-coral text-xs font-semibold font-mono tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-coral" />
            {activeDisaster ? activeDisaster.source : 'National Early Warning Network'}
          </span>
          <span className="text-xs font-mono text-ink-muted">
            Sector: {activeDisaster ? activeDisaster.locationName : 'Regional Operational Sector'}
          </span>
          {activeDisaster?.distanceKm !== undefined && (
            <>
              <span className="hidden sm:inline-block text-hairline">•</span>
              <span className="text-xs font-mono text-coral bg-coral-subtle border border-coral-border px-2 py-0.5 rounded">
                {activeDisaster.distanceKm < 1
                  ? 'Immediate Sector (< 1 km)'
                  : `${activeDisaster.distanceKm.toFixed(0)} km from your location`}
              </span>
            </>
          )}
          <span className="hidden sm:inline-block text-hairline">•</span>
          <span className="text-xs font-mono text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded">
            SSE Stream: ACTIVE
          </span>
        </div>

        {/* Monumental Headline in Newsreader Serif (Fluid sizing on mobile) */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-ink tracking-tight leading-[1.15]">
          {activeDisaster
            ? activeDisaster.title
            : 'Brahmaputra Basin Flood Inundation & Early Warning Network'}
        </h1>

        {/* Humanist Subtitle */}
        <p className="text-base sm:text-lg text-ink-body leading-relaxed max-w-3xl">
          {activeDisaster
            ? activeDisaster.description
            : 'Monitor real-time hydrological stage levels, locate verified high-ground evacuation shelters with live capacity, and follow authoritative civil protection directives issued by the Assam State Disaster Management Authority.'}
        </p>

        {/* Primary Action Button Cluster — minimal & focused */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* SOS — primary, most prominent */}
          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#9E2A2B] hover:bg-[#852223] active:scale-[0.97] text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
            title="Trigger Emergency Distress SOS"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <AlertOctagon className="w-4 h-4" />
            <span>Emergency SOS</span>
          </button>

          {/* Report — secondary */}
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-coral hover:bg-coral-hover active:bg-coral-active active:scale-[0.97] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Report Incident</span>
          </Link>

          {/* Map — ghost tertiary */}
          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-hairline bg-white/70 hover:bg-canvas text-ink-body hover:text-ink text-sm font-medium shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <Layers className="w-4 h-4 text-coral" />
            <span>Live Map</span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Live River & Sector Telemetry Strip */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-hairline text-xs font-mono text-ink-muted">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-[#1E40AF]" />
            <span>
              Active Inundation: <strong className="text-ink font-semibold">{activeDisaster ? `${activeDisaster.locationName} (${activeDisaster.radiusKm} km)` : 'Regional Basin Surveillance'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-coral" />
            <span>
              AI Hazard Index: <strong className="text-ink font-semibold">{riskData?.riskScore !== undefined ? `${riskData.riskScore.toFixed(0)} / 100 (${riskData.riskLevel})` : 'Calculating...'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#166534]" />
            <span>
              Refuge Havens: <strong className="text-ink font-semibold">{safeZones.length} Designated Open</strong>
            </span>
          </div>
        </div>
      </section>

      {/* INNOVATION SPOTLIGHT: TRINETRA RELAY — SOS WITHOUT INTERNET */}
      <section className="bg-gradient-to-r from-[#FAF9F5] via-white to-[#FDF4F0] border border-coral-border rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDF2F2] border border-[#F5C2C2] text-[#9E2A2B] text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B] animate-ping" />
              Innovation Feature • Offline Mesh
            </span>
            <span className="text-xs font-mono text-ink-muted">Delay-Tolerant Mesh</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink">
            TRINETRA RELAY: Emergency SOS Without Internet
          </h2>
          <p className="text-xs sm:text-sm text-ink-body leading-relaxed">
            Stranded in a complete cellular blackout? TRINETRA RELAY stores your distress packet locally and silently hops it across nearby peer smartphones via Bluetooth LE and Wi-Fi Direct until it reaches an active internet gateway or emergency boat.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-lg bg-[#9E2A2B] hover:bg-[#852223] active:bg-[#6D1D1E] text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>Transmit SOS</span>
          </button>
          <Link
            to="/relay"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-coral hover:bg-coral-hover text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition"
          >
            <span>Explore TRINETRA RELAY</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 2. SPATIAL REALITY: Full-Width Interactive GIS Situational Picture */}
      <section className="bg-white border border-hairline rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-coral" />
              <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink">
                Live Geospatial Situational Canvas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Cartographic visualization of active flood breach zones, high-ground evacuation camps, and geocoded citizen reports.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-ink-muted bg-canvas border border-hairline px-2.5 py-1 rounded">
              {latitude ? `${latitude.toFixed(4)}°N, ${longitude?.toFixed(4)}°E` : 'Kamrup Metropolitan Sector'}
            </span>
            <Link
              to="/geo-intelligence"
              className="text-xs font-semibold text-ink-body hover:text-coral flex items-center gap-1 whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 text-coral" />
              <span>Geo Search</span>
            </Link>
            <Link
              to="/map"
              className="text-xs font-semibold text-coral hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>Full Screen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Regional Quick Navigation & Type Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Region Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {HOME_REGION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setActiveRegion(preset.id);
                  setMapCenter(preset.center);
                  setMapZoom(preset.zoom);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition border ${
                  activeRegion === preset.id
                    ? 'bg-ink text-white border-ink font-semibold shadow-xs'
                    : 'bg-white hover:bg-canvas text-ink border-hairline shadow-card'
                }`}
              >
                {preset.name}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setActiveRegion('gps');
                refetchLocation();
                if (latitude && longitude) {
                  setMapCenter([latitude, longitude]);
                  setMapZoom(11);
                }
              }}
              disabled={geoLoading}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition border ${
                activeRegion === 'gps'
                  ? 'bg-coral text-white border-coral font-semibold shadow-xs'
                  : 'bg-white hover:bg-canvas text-ink border-hairline shadow-card'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
              <span>{geoLoading ? 'Acquiring...' : 'My GPS'}</span>
            </button>
          </div>

          {/* Disaster Type Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar text-[11px]">
            {['ALL', 'FLOOD', 'CYCLONE', 'LANDSLIDE', 'URBAN_EMERGENCY'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDisasterTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg border font-mono transition whitespace-nowrap ${
                  disasterTypeFilter === t
                    ? 'bg-coral-subtle text-coral border-coral font-bold'
                    : 'bg-canvas text-ink-muted border-hairline hover:text-ink'
                }`}
              >
                {t === 'ALL' ? `All (${disasters.length})` : t}
              </button>
            ))}
          </div>
        </div>

        {/* Embedded Leaflet Map with Pan-India Coverage */}
        <div className="rounded-xl overflow-hidden border border-hairline shadow-card">
          <DisasterLeafletMap
            disasters={disasters}
            safeZones={safeZones}
            resources={resources}
            reports={reports}
            userLat={latitude}
            userLng={longitude}
            height="540px"
            center={mapCenter}
            zoom={mapZoom}
            fitPanIndia={activeRegion === 'all'}
            typeFilter={disasterTypeFilter}
            onResetPanIndia={() => {
              setActiveRegion('all');
              setMapCenter([22.3511, 78.6677]);
              setMapZoom(5);
            }}
          />
        </div>

        {/* Map Legend Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-ink-muted pt-1 gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 font-medium text-ink-body">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C64545]" />
              Active Hazards ({disasters.length})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-ink-body">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
              Safe Shelters ({safeZones.length})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-ink-body">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              Medical & Relief Bases ({resources.length})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-ink-body">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              Citizen Reports ({reports.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-ink-subtle">
            Pan-India Surveillance • WGS-84 Coordinate Standard
          </span>
        </div>
      </section>

      {/* 3. TWO-COLUMN ASYMMETRIC EMERGENCY INTEL: Evacuation Order + Safe Havens */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Official State Evacuation Order (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-hairline rounded-2xl p-6 sm:p-7 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase text-coral tracking-wider">
                State Civil Protection Directive
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
                Official Evacuation Notice
              </h2>
            </div>
            {urgentAlert && <Badge severity={urgentAlert.severity} />}
          </div>

          {urgentAlert ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-[#9E2A2B]">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold uppercase font-mono tracking-wider">
                    {urgentAlert.title}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink leading-snug">
                  {urgentAlert.headline}
                </p>
                <p className="text-xs text-ink-body leading-relaxed">
                  {urgentAlert.detailedMessage}
                </p>
              </div>

              {/* Action Directives / 3-Step Evacuation Protocol */}
              <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-2.5">
                <p className="text-xs font-semibold text-coral uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Mandatory Action Directives (ASDMA SOP)
                </p>
                <div className="text-xs text-ink-body font-mono leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-hairline">
                  {urgentAlert.actionInstructions}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                <span>Target Radius: <strong>{urgentAlert.targetRadiusKm} km</strong> around {urgentAlert.targetAreaName}</span>
                <Link to="/alerts" className="text-coral hover:underline font-semibold flex items-center gap-1">
                  <span>View All Alerts</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-ink-muted bg-canvas rounded-xl border border-hairline">
              <CheckCircle2 className="w-8 h-8 text-[#166534] mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink">No Mandatory Evacuation Orders Active</p>
              <p className="text-xs text-ink-muted mt-1">Normal hydrological surveillance in effect.</p>
            </div>
          )}
        </div>

        {/* Right Column: Nearest Verified High-Ground Shelters (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-hairline rounded-2xl p-6 sm:p-7 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase text-[#166534] tracking-wider">
                High-Ground Refuge Havens
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
                Designated Safe Shelters
              </h2>
            </div>
            <Link to="/safe-zones" className="text-xs text-ink-muted hover:text-coral font-medium">
              All ({safeZones.length}) →
            </Link>
          </div>

          <div className="space-y-3.5">
            {safeZones.slice(0, 3).map((sz) => {
              const occRatio = sz.capacityTotal > 0 ? sz.capacityOccupied / sz.capacityTotal : 0;
              const occPct = Math.round(occRatio * 100);

              return (
                <div
                  key={sz.id}
                  className="p-4 bg-canvas border border-hairline rounded-xl hover:bg-canvas-subtle transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-ink leading-tight">{sz.name}</h3>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-ink-subtle flex-shrink-0" />
                        <span>{sz.locationName}</span>
                      </p>
                    </div>
                    <Badge status={sz.status} />
                  </div>

                  {/* Elevation & Distance */}
                  <div className="flex items-center space-x-2 text-xs font-mono text-ink-muted">
                    {sz.elevationMeters && (
                      <span className="bg-white px-2 py-0.5 rounded border border-hairline text-ink-body">
                        ⛰️ {sz.elevationMeters}m MSL
                      </span>
                    )}
                    {sz.distanceKm !== undefined && (
                      <span className="bg-white px-2 py-0.5 rounded border border-hairline text-[#1E40AF] font-semibold">
                        📍 {sz.distanceKm} km away
                      </span>
                    )}
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-ink-muted">
                      <span>Capacity Utilization</span>
                      <span className={occPct > 85 ? 'text-[#9E2A2B] font-semibold' : 'text-[#166534] font-semibold'}>
                        {sz.capacityOccupied} / {sz.capacityTotal} beds ({occPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-canvas-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occPct > 85
                            ? 'bg-[#9E2A2B]'
                            : occPct > 60
                            ? 'bg-[#D97706]'
                            : 'bg-[#166534]'
                        }`}
                        style={{ width: `${Math.min(100, occPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* 1-Tap Google Maps Directions */}
                  <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs">
                    <span className="text-[11px] text-ink-subtle">Equipped with Medical & Food</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${sz.latitude},${sz.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-coral hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Get Route Directions</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. VERIFIED CITIZEN GROUND INTEL STREAM (Proof of Life / Community Telemetry) */}
      <section className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase text-coral tracking-wider">
              Crowdsourced Eyewitness Intelligence
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
              Live Ground Incident Reports
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Verified ground intel submitted by citizens, validated by ASDMA commanders for rescue dispatch.
            </p>
          </div>

          <Link
            to="/report"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-coral hover:bg-coral-hover active:bg-coral-active text-white rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Submit Eyewitness Report</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reports.slice(0, 2).map((rpt) => (
            <div
              key={rpt.id}
              className="bg-canvas border border-hairline rounded-xl p-4 space-y-3 hover:bg-canvas-subtle transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-coral">{rpt.trackingCode}</span>
                  <Badge status={rpt.status} />
                </div>
                <h4 className="text-sm font-semibold text-ink leading-tight">{rpt.title}</h4>
                <p className="text-xs text-ink-body line-clamp-2 leading-relaxed">{rpt.description}</p>
                <div className="flex items-center gap-1 text-[11px] text-ink-muted font-mono pt-1">
                  <MapPin className="w-3 h-3 text-ink-subtle flex-shrink-0" />
                  <span className="truncate">{rpt.locationName}</span>
                </div>
              </div>

              {rpt.imageUrl && (
                <div className="pt-2 border-t border-hairline">
                  <img
                    src={rpt.imageUrl}
                    alt="Ground Evidence"
                    className="w-full h-32 object-cover rounded-lg border border-hairline"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Invitation / Call to Action Card */}
          <div className="bg-canvas border-2 border-dashed border-hairline rounded-xl p-5 flex flex-col justify-between space-y-4 text-center items-center">
            <div className="w-12 h-12 rounded-xl bg-coral-subtle text-coral flex items-center justify-center mx-auto mt-2">
              <FilePlus2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-ink">Have Boots on the Ground?</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Submit localized flood height, road blockages, or trapped residents with GPS geocodes to help commanders direct rescue boat deployment.
              </p>
            </div>
            <Link
              to="/report"
              className="w-full py-2 bg-white hover:bg-canvas text-coral border border-coral-border rounded-lg text-xs font-semibold shadow-card transition"
            >
              File Eyewitness Incident →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. 24x7 STATE CRISIS DIRECTORY: Direct Emergency Dialers */}
      <section className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase text-coral tracking-wider">
              Immediate Life-Safety Response
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
              Emergency Distress Helplines (24x7 Active)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded">
            Lines Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <a
            href="tel:112"
            className="p-4 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl hover:bg-[#FBE8E8] transition group shadow-card flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] text-[#9E2A2B] font-semibold uppercase tracking-wider font-mono">
                National Emergency
              </p>
              <p className="text-2xl font-bold text-ink">112</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Police & Immediate SOS</p>
            </div>
            <PhoneCall className="w-5 h-5 text-[#9E2A2B] group-hover:scale-110 transition" />
          </a>

          <a
            href="tel:1070"
            className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl hover:bg-[#FEF3C7] transition group shadow-card flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] text-[#92400E] font-semibold uppercase tracking-wider font-mono">
                NDRF Disaster
              </p>
              <p className="text-2xl font-bold text-ink">1070</p>
              <p className="text-[11px] text-ink-muted mt-0.5">State Flood Rescue Desk</p>
            </div>
            <PhoneCall className="w-5 h-5 text-[#92400E] group-hover:scale-110 transition" />
          </a>

          <a
            href="tel:108"
            className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl hover:bg-[#DBEAFE] transition group shadow-card flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] text-[#1E40AF] font-semibold uppercase tracking-wider font-mono">
                Medical Trauma
              </p>
              <p className="text-2xl font-bold text-ink">108</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Ambulance & Paramedics</p>
            </div>
            <PhoneCall className="w-5 h-5 text-[#1E40AF] group-hover:scale-110 transition" />
          </a>

          <a
            href="tel:101"
            className="p-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl hover:bg-[#FDE68A] transition group shadow-card flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] text-[#78350F] font-semibold uppercase tracking-wider font-mono">
                Fire & Water Rescue
              </p>
              <p className="text-2xl font-bold text-ink">101</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Fire & Emergency Services</p>
            </div>
            <PhoneCall className="w-5 h-5 text-[#78350F] group-hover:scale-110 transition" />
          </a>
        </div>
      </section>

      {/* Emergency Distress SOS Modal (Available strictly on Home Page) */}
      <EmergencySosModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />
    </div>
  );
};
