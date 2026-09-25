// client/src/pages/citizen/CitizenPortalPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FilePlus2,
  MapPin,
  Clock,
  ArrowRight,
  Phone,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Truck,
  Users,
  TrendingUp,
  Activity,
  Layers,
  Radio,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { IncidentReport, SafeZone, Alert, RiskAssessment, Disaster } from '../../types';
import { Badge } from '../../components/common/Badge';

export const CitizenPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();

  const [activeDisasters, setActiveDisasters] = useState<Disaster[]>([]);
  const [allReports, setAllReports] = useState<IncidentReport[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [riskData, setRiskData] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportTab, setReportTab] = useState<'my' | 'community'>('my');

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const latQuery = latitude && longitude ? `?lat=${latitude}&lng=${longitude}` : '';

        // 1. Fetch live operational telemetry in parallel
        const [disastersRes, safeZonesRes, alertsRes, reportsRes] = await Promise.all([
          api.get(`/disasters${latQuery}`),
          api.get(`/safe-zones${latQuery}`),
          api.get('/alerts?status=ACTIVE'),
          api.get('/reports?status=ALL'),
        ]);

        let loadedDisasters: Disaster[] = [];
        if (disastersRes.data.success) {
          loadedDisasters = disastersRes.data.data;
          setActiveDisasters(loadedDisasters.filter((d) => d.status === 'ACTIVE'));
        }

        if (safeZonesRes.data.success) {
          setSafeZones(safeZonesRes.data.data);
        }

        if (alertsRes.data.success) {
          setAlerts(alertsRes.data.data);
        }

        if (reportsRes.data.success) {
          setAllReports(reportsRes.data.data);
        }

        // 2. Query dynamic risk engine based on active disaster sector or coordinates
        const primaryLocation = loadedDisasters[0]?.locationName || 'Guwahati';
        try {
          const riskRes = await api.get(`/risk/${encodeURIComponent(primaryLocation)}${latQuery}`);
          if (riskRes.data.success) {
            setRiskData(riskRes.data.data);
          }
        } catch (riskErr) {
          console.warn('Risk evaluation returned fallback:', riskErr);
        }
      } catch (err) {
        console.error('Failed to load citizen portal telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [user, latitude, longitude]);

  // Authenticate user-submitted reports matching user id, full name, email, or phone
  const userReports = allReports.filter((r) => {
    if (user?.id && r.citizenId === user.id) return true;
    if (user?.email && r.citizenName?.toLowerCase() === user.email.toLowerCase()) return true;
    if (user?.fullName && r.citizenName?.toLowerCase() === user.fullName.toLowerCase()) return true;
    if (user?.phone && r.citizenPhone && r.citizenPhone === user.phone) return true;
    return false;
  });

  const activeDisaster = activeDisasters[0];
  const nearestShelter = safeZones[0];
  const activeAlert = alerts[0];

  // Dynamic alert computations
  const evacuationOrders = alerts.filter(
    (a) => a.type === 'EVACUATION_ORDER' || a.severity === 'CRITICAL'
  );
  const civilAdvisories = alerts.filter((a) => a.type !== 'EVACUATION_ORDER');

  const displayedReports = reportTab === 'my' ? userReports : allReports;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      {/* 1. CITIZEN PERSONAL SAFETY STATUS BANNER */}
      <section className="bg-white border border-hairline rounded-2xl p-4 sm:p-8 shadow-card space-y-5 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-hairline pb-4 sm:pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-[#22C55E]" />
              <span className="text-[10px] sm:text-xs font-mono font-semibold text-coral uppercase tracking-wider">
                Citizen Safety Portal • Connected
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-serif font-normal text-ink">
              Welcome, {user?.fullName || 'Citizen'}
            </h1>
            <p className="text-xs text-ink-muted font-mono">
              Account: {user?.email} • Contact: {user?.phone || 'Emergency standby'} • GPS:{' '}
              {latitude && longitude
                ? `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`
                : 'Sector Baseline'}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
            <Link
              to="/report"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-coral hover:bg-coral-hover active:bg-coral-active text-white text-xs font-semibold rounded-xl shadow-xs transition whitespace-nowrap"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Submit Report</span>
            </Link>

            <Link
              to="/geo-intelligence"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-canvas text-ink border border-hairline text-xs font-semibold rounded-xl shadow-card transition whitespace-nowrap"
            >
              <Activity className="w-3.5 h-3.5 text-coral" />
              <span>Geo-Intelligence</span>
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-canvas text-ink border border-hairline text-xs font-semibold rounded-xl shadow-card transition whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-coral" />
              <span>Live GIS Map</span>
            </Link>
          </div>
        </div>

        {/* Real-time Sector Snapshot (3 Tiles) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Tile 1: Local Sector Threat */}
          <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">
                Sector Hazard Index
              </span>
              <TrendingUp className="w-4 h-4 text-coral" />
            </div>
            <p className="text-2xl font-serif font-bold text-ink">
              {riskData?.riskScore !== undefined ? (
                <>
                  {Math.round(riskData.riskScore)}{' '}
                  <span className="text-xs text-ink-muted font-mono font-normal">/ 100</span>
                </>
              ) : loading ? (
                <span className="text-base text-ink-muted font-mono font-normal animate-pulse">
                  Evaluating...
                </span>
              ) : (
                <span className="text-base text-ink-muted font-mono font-normal">--</span>
              )}
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <Badge variant="risk" label={riskData?.riskLevel || 'MONITORED'} />
              <span className="text-[11px] text-ink-muted font-mono truncate max-w-[150px]">
                {riskData?.locationName || activeDisaster?.locationName || 'Local Sector'}
              </span>
            </div>
          </div>

          {/* Tile 2: Active Evacuation Orders */}
          <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">
                Civil Emergency Directives
              </span>
              <Radio className="w-4 h-4 text-[#D97706]" />
            </div>
            <p className="text-base font-bold text-ink truncate">
              {activeAlert
                ? activeAlert.headline || activeAlert.title
                : loading
                ? 'Loading directives...'
                : 'No Active Directives in Sector'}
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span
                className={`text-xs font-mono font-medium ${
                  evacuationOrders.length > 0 ? 'text-[#9E2A2B] font-bold' : 'text-[#166534]'
                }`}
              >
                {evacuationOrders.length > 0
                  ? `${evacuationOrders.length} Evacuation Order${
                      evacuationOrders.length > 1 ? 's' : ''
                    } Active`
                  : civilAdvisories.length > 0
                  ? `${civilAdvisories.length} Active Advisories`
                  : 'Normal Readiness Baseline'}
              </span>
              <Link to="/alerts" className="text-coral hover:underline font-semibold text-xs">
                Directives →
              </Link>
            </div>
          </div>

          {/* Tile 3: Nearest Refuge Camp */}
          <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">
                Designated Safe Haven
              </span>
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
            </div>
            <p className="text-base font-bold text-ink truncate">
              {nearestShelter
                ? nearestShelter.name
                : loading
                ? 'Locating refuge...'
                : 'No Designated Shelters in Sector'}
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-ink-muted font-mono">
                {nearestShelter?.distanceKm !== undefined
                  ? `${nearestShelter.distanceKm.toFixed(1)} km away`
                  : nearestShelter
                  ? `${nearestShelter.locationName}`
                  : 'Check local DDMA'}
              </span>
              {nearestShelter ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.latitude},${nearestShelter.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-coral hover:underline font-semibold text-xs flex items-center gap-0.5"
                >
                  <span>Route</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              ) : (
                <Link to="/safe-zones" className="text-coral hover:underline text-xs">
                  View Camps →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. MY SUBMITTED INCIDENT REPORTS & LIVE DISPATCH TRACKER */}
      <section className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase text-coral tracking-wider">
              Verification & Dispatch Stream
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
              Crowdsourced Field Intel Tracker
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Live status showing authority triage, responder dispatch, and on-ground resolution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Filter Pill */}
            <div className="flex items-center p-1 bg-canvas border border-hairline rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setReportTab('my')}
                className={`px-3 py-1.5 rounded-md transition font-mono ${
                  reportTab === 'my'
                    ? 'bg-white text-ink shadow-sm font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                My Reports ({userReports.length})
              </button>
              <button
                type="button"
                onClick={() => setReportTab('community')}
                className={`px-3 py-1.5 rounded-md transition font-mono ${
                  reportTab === 'community'
                    ? 'bg-white text-ink shadow-sm font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Sector Feed ({allReports.length})
              </button>
            </div>

            <Link
              to="/report"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-coral hover:bg-coral-hover text-white rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>File Incident</span>
            </Link>
          </div>
        </div>

        {displayedReports.length === 0 ? (
          <div className="p-12 text-center text-ink-muted bg-canvas rounded-xl border border-hairline space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#166534] mx-auto" />
            <h3 className="text-base font-semibold text-ink">
              {reportTab === 'my'
                ? 'You have not submitted any ground reports yet'
                : 'No incident reports logged in this sector yet'}
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              {reportTab === 'my'
                ? 'Notice water overflow, washed-out bridges, or trapped citizens? Submit a geotagged report to alert State Emergency Operation Centers.'
                : 'All reported hazard incidents will appear here once submitted by on-ground witnesses.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to="/report"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Submit Ground Report</span>
              </Link>
              {reportTab === 'my' && allReports.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReportTab('community')}
                  className="px-4 py-2 bg-white hover:bg-canvas text-ink border border-hairline text-xs font-semibold rounded-lg shadow-card transition"
                >
                  View Sector Feed ({allReports.length})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedReports.map((rpt) => (
              <div
                key={rpt.id}
                className="p-5 bg-canvas border border-hairline rounded-xl hover:bg-canvas-subtle transition space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-coral">
                        {rpt.trackingCode}
                      </span>
                      <Badge status={rpt.status} />
                      <span className="text-[11px] text-ink-subtle font-mono">
                        {new Date(rpt.createdAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-ink leading-tight">{rpt.title}</h3>
                    <p className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
                      <span>{rpt.locationName}</span>
                      {rpt.citizenName && (
                        <span className="text-ink-subtle ml-2">
                          • Reported by {rpt.citizenName}
                        </span>
                      )}
                    </p>
                  </div>

                  {rpt.imageUrl && (
                    <img
                      src={rpt.imageUrl}
                      alt="Proof"
                      className="w-20 h-20 object-cover rounded-lg border border-hairline flex-shrink-0"
                    />
                  )}
                </div>

                <p className="text-xs text-ink-body bg-white p-3 rounded-lg border border-hairline leading-relaxed">
                  {rpt.description}
                </p>

                {/* Authority Triage Feedback Box */}
                {rpt.authorityNotes && (
                  <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-[#92400E] font-semibold font-mono text-[10px] uppercase">
                      <Truck className="w-3.5 h-3.5" />
                      <span>ASDMA / NDRF Control Response Note</span>
                    </div>
                    <p className="text-[#78350F]">{rpt.authorityNotes}</p>
                  </div>
                )}

                {/* Progress Timeline Stepper */}
                <div className="pt-2 border-t border-hairline">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#166534] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Submitted
                    </span>
                    <span className="text-hairline">───</span>
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        rpt.status !== 'PENDING_VERIFICATION' && rpt.status !== 'REJECTED'
                          ? 'text-[#166534]'
                          : 'text-ink-subtle'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Verified by EOC
                    </span>
                    <span className="text-hairline">───</span>
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        rpt.status === 'DISPATCHED' || rpt.status === 'RESOLVED'
                          ? 'text-[#1E40AF]'
                          : 'text-ink-subtle'
                      }`}
                    >
                      <Truck className="w-3 h-3" /> Unit Dispatched
                    </span>
                    <span className="text-hairline">───</span>
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        rpt.status === 'RESOLVED' ? 'text-[#166534]' : 'text-ink-subtle'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. ASSIGNED REFUGE HAVEN & COMMUNITY RESOURCES */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Nearest Safe Haven Details (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-hairline rounded-2xl p-6 sm:p-7 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase text-[#166534] tracking-wider">
                Assigned Emergency Haven
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
                {nearestShelter ? nearestShelter.name : 'Sector Safe Haven Coordination'}
              </h2>
            </div>
            {nearestShelter && <Badge status={nearestShelter.status} />}
          </div>

          {nearestShelter ? (
            <div className="space-y-4 text-xs">
              <p className="text-ink-body leading-relaxed">
                Designated refuge haven for evacuees in{' '}
                <span className="font-semibold text-ink">{nearestShelter.locationName}</span>.
                {nearestShelter.amenities
                  ? ` On-site provisions: ${
                      Array.isArray(nearestShelter.amenities)
                        ? nearestShelter.amenities.join(', ')
                        : (() => {
                            try {
                              return JSON.parse(nearestShelter.amenities as string).join(', ');
                            } catch {
                              return nearestShelter.amenities;
                            }
                          })()
                    }.`
                  : ''}
                {nearestShelter.contactPerson
                  ? ` Camp Administrator: ${nearestShelter.contactPerson}.`
                  : ''}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-canvas border border-hairline rounded-lg">
                  <span className="text-ink-subtle block font-sans text-[10px]">Location</span>
                  <span className="font-semibold text-ink truncate block">
                    {nearestShelter.locationName}
                  </span>
                </div>
                <div className="p-3 bg-canvas border border-hairline rounded-lg">
                  <span className="text-ink-subtle block font-sans text-[10px]">Site Elevation</span>
                  <span className="font-semibold text-ink">
                    {nearestShelter.elevationMeters
                      ? `${nearestShelter.elevationMeters}m MSL`
                      : 'High Ground'}
                  </span>
                </div>
                <div className="p-3 bg-canvas border border-hairline rounded-lg">
                  <span className="text-ink-subtle block font-sans text-[10px]">Proximity</span>
                  <span className="font-semibold text-[#1E40AF]">
                    {nearestShelter.distanceKm !== undefined
                      ? `${nearestShelter.distanceKm.toFixed(1)} km away`
                      : 'Local Sector'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-canvas border border-hairline rounded-xl space-y-2">
                <div className="flex justify-between font-mono text-[11px] text-ink-muted">
                  <span>Shelter Bed Capacity</span>
                  <span>
                    {nearestShelter.capacityOccupied} / {nearestShelter.capacityTotal} beds (
                    {Math.round(
                      (nearestShelter.capacityOccupied / nearestShelter.capacityTotal) * 100
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-hairline">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      nearestShelter.capacityOccupied / nearestShelter.capacityTotal > 0.85
                        ? 'bg-[#9E2A2B]'
                        : 'bg-[#166534]'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (nearestShelter.capacityOccupied / nearestShelter.capacityTotal) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                {nearestShelter.contactPhone && (
                  <a
                    href={`tel:${nearestShelter.contactPhone}`}
                    className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-ink-subtle" />
                    <span>Camp Desk: {nearestShelter.contactPhone}</span>
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.latitude},${nearestShelter.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-coral hover:bg-coral-hover text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Navigate with GPS</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-ink-muted text-xs font-mono">
              <p>No designated shelters currently registered for this sector.</p>
              <p className="mt-1 text-ink-subtle">
                Emergency evacuation convoys will be coordinated via hotlines 112 / 1070.
              </p>
            </div>
          )}
        </div>

        {/* Emergency First-Response Helplines (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-hairline rounded-2xl p-6 sm:p-7 shadow-card space-y-4">
          <div className="border-b border-hairline pb-4">
            <span className="text-[11px] font-mono font-semibold uppercase text-coral tracking-wider">
              24x7 Government Life-Safety Direct Dial
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
              Emergency Hotlines
            </h2>
          </div>

          <div className="space-y-3">
            <a
              href="tel:112"
              className="p-3.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl hover:bg-[#FBE8E8] transition group shadow-card flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] text-[#9E2A2B] font-semibold uppercase font-mono">
                  National Unified Emergency
                </p>
                <p className="text-xl font-bold text-ink">112</p>
              </div>
              <Phone className="w-5 h-5 text-[#9E2A2B] group-hover:scale-110 transition" />
            </a>

            <a
              href="tel:1070"
              className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl hover:bg-[#FEF3C7] transition group shadow-card flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] text-[#92400E] font-semibold uppercase font-mono">
                  State Disaster Control Room / NDRF
                </p>
                <p className="text-xl font-bold text-ink">1070</p>
              </div>
              <Phone className="w-5 h-5 text-[#92400E] group-hover:scale-110 transition" />
            </a>

            <a
              href="tel:108"
              className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl hover:bg-[#DBEAFE] transition group shadow-card flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] text-[#1E40AF] font-semibold uppercase font-mono">
                  Emergency Medical / Ambulance Dispatch
                </p>
                <p className="text-xl font-bold text-ink">108</p>
              </div>
              <Phone className="w-5 h-5 text-[#1E40AF] group-hover:scale-110 transition" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
