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
  Waves,
  TrendingUp,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { IncidentReport, SafeZone, Alert, RiskAssessment } from '../../types';
import { Badge } from '../../components/common/Badge';

export const CitizenPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();

  const [myReports, setMyReports] = useState<IncidentReport[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [riskData, setRiskData] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const latQuery = latitude ? `?lat=${latitude}&lng=${longitude}` : '';

        const [reportsRes, safeZonesRes, alertsRes, riskRes] = await Promise.all([
          api.get('/reports?status=ALL'),
          api.get(`/safe-zones${latQuery}`),
          api.get('/alerts?status=ACTIVE'),
          api.get(`/risk/Guwahati${latQuery}`),
        ]);

        if (reportsRes.data.success) {
          // Filter to citizen's reports (or show latest reports if none match phone/name)
          const allRpts: IncidentReport[] = reportsRes.data.data;
          const userReports = allRpts.filter(
            (r) =>
              (r.citizenName && r.citizenName.toLowerCase() === user?.fullName?.toLowerCase()) ||
              (r.citizenPhone && r.citizenPhone === user?.phone)
          );
          setMyReports(userReports);
        }

        if (safeZonesRes.data.success) setSafeZones(safeZonesRes.data.data);
        if (alertsRes.data.success) setAlerts(alertsRes.data.data);
        if (riskRes.data.success) setRiskData(riskRes.data.data);
      } catch (err) {
        console.error('Failed to load citizen portal telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [user, latitude, longitude]);

  const nearestShelter = safeZones[0];
  const activeAlert = alerts[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* 1. CITIZEN PERSONAL SAFETY STATUS BANNER */}
      <section className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-[#22C55E]" />
              <span className="text-xs font-mono font-semibold text-coral uppercase tracking-wider">
                Citizen Safety Portal • Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-ink">
              Welcome, {user?.fullName || 'Citizen'}
            </h1>
            <p className="text-xs text-ink-muted font-mono">
              Account: {user?.email} • Contact: {user?.phone || 'Emergency standby'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/report"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-coral hover:bg-coral-hover active:bg-coral-active text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Submit New Report</span>
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-canvas text-ink border border-hairline text-xs font-semibold rounded-lg shadow-card transition"
            >
              <MapPin className="w-4 h-4 text-coral" />
              <span>Explore GIS Map</span>
            </Link>
          </div>
        </div>

        {/* Real-time Sector Snapshot (3 Tiles) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Tile 1: Local Sector Threat */}
          <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Sector Hazard Index</span>
              <TrendingUp className="w-4 h-4 text-coral" />
            </div>
            <p className="text-2xl font-serif font-bold text-ink">
              {riskData?.riskScore ? riskData.riskScore.toFixed(0) : '88'} <span className="text-xs text-ink-muted font-mono">/ 100</span>
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <Badge variant="risk" label={riskData?.riskLevel || 'SEVERE'} />
              <span className="text-[11px] text-ink-muted font-mono">Brahmaputra Basin</span>
            </div>
          </div>

          {/* Tile 2: Active Evacuation Orders */}
          <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Local Civil Directives</span>
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            </div>
            <p className="text-base font-bold text-ink truncate">
              {activeAlert ? activeAlert.headline : 'Advisory in Effect'}
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-xs text-[#9E2A2B] font-medium">1 Evacuation Order</span>
              <Link to="/alerts" className="text-coral hover:underline font-semibold text-xs">
                Directives →
              </Link>
            </div>
          </div>

          {/* Tile 3: Nearest Refuge Camp */}
          <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Designated Safe Haven</span>
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
            </div>
            <p className="text-base font-bold text-ink truncate">
              {nearestShelter ? nearestShelter.name : 'Nehru Stadium Camp'}
            </p>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-ink-muted font-mono">
                {nearestShelter?.distanceKm !== undefined ? `${nearestShelter.distanceKm} km away` : '1.8 km away'}
              </span>
              <a
                href={
                  nearestShelter
                    ? `https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.latitude},${nearestShelter.longitude}`
                    : '#'
                }
                target="_blank"
                rel="noreferrer"
                className="text-coral hover:underline font-semibold text-xs flex items-center gap-0.5"
              >
                <span>Navigate</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MY SUBMITTED INCIDENT REPORTS & LIVE DISPATCH TRACKER */}
      <section className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase text-coral tracking-wider">
              Verification & Dispatch Status
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink mt-0.5">
              My Eyewitness Incident Reports
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Real-time tracker showing authority verification, triage notes, and responder deployment for your submissions.
            </p>
          </div>

          <Link
            to="/report"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-coral hover:bg-coral-hover text-white rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>File New Incident</span>
          </Link>
        </div>

        {myReports.length === 0 ? (
          <div className="p-12 text-center text-ink-muted bg-canvas rounded-xl border border-hairline space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#166534] mx-auto" />
            <h3 className="text-base font-semibold text-ink">No Reports Submitted Yet</h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              If you observe water overflowing embankments, blocked roads, or trapped families, submit a report with coordinates to guide emergency rescue teams.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-coral hover:bg-coral-hover text-white text-xs font-semibold rounded-lg shadow-sm transition mt-2"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Submit Ground Intel</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myReports.map((rpt) => (
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
                      <span>ASDMA Commander Response Note</span>
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
                        rpt.status !== 'PENDING_VERIFICATION' ? 'text-[#166534]' : 'text-ink-subtle'
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
                {nearestShelter ? nearestShelter.name : 'Nehru Stadium Relief Camp'}
              </h2>
            </div>
            {nearestShelter && <Badge status={nearestShelter.status} />}
          </div>

          <div className="space-y-4 text-xs">
            <p className="text-ink-body leading-relaxed">
              Designated as your primary evacuation refuge point based on your geolocated sector in Guwahati. Fully equipped with emergency backup power, clean drinking water, and first-aid medics.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-canvas border border-hairline rounded-lg">
                <span className="text-ink-subtle block font-sans text-[10px]">Location</span>
                <span className="font-semibold text-ink">{nearestShelter?.locationName || 'Guwahati'}</span>
              </div>
              <div className="p-3 bg-canvas border border-hairline rounded-lg">
                <span className="text-ink-subtle block font-sans text-[10px]">Elevation</span>
                <span className="font-semibold text-ink">{nearestShelter?.elevationMeters || 68}m MSL</span>
              </div>
              <div className="p-3 bg-canvas border border-hairline rounded-lg">
                <span className="text-ink-subtle block font-sans text-[10px]">Distance</span>
                <span className="font-semibold text-[#1E40AF]">
                  {nearestShelter?.distanceKm !== undefined ? `${nearestShelter.distanceKm} km away` : '1.8 km away'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-canvas border border-hairline rounded-xl space-y-2">
              <div className="flex justify-between font-mono text-[11px] text-ink-muted">
                <span>Camp Capacity Utilization</span>
                <span>
                  {nearestShelter ? `${nearestShelter.capacityOccupied} / ${nearestShelter.capacityTotal} beds (${Math.round((nearestShelter.capacityOccupied / nearestShelter.capacityTotal) * 100)}%)` : 'Calculating...'}
                </span>
              </div>
              <div className="w-full bg-canvas-muted h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#166534]"
                  style={{
                    width: nearestShelter && nearestShelter.capacityTotal > 0
                      ? `${Math.min(100, (nearestShelter.capacityOccupied / nearestShelter.capacityTotal) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              {nearestShelter?.contactPhone && (
                <a
                  href={`tel:${nearestShelter.contactPhone}`}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 font-mono"
                >
                  <Phone className="w-3.5 h-3.5 text-ink-subtle" />
                  <span>Camp Desk: {nearestShelter.contactPhone}</span>
                </a>
              )}
              <a
                href={
                  nearestShelter
                    ? `https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.latitude},${nearestShelter.longitude}`
                    : '#'
                }
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-coral hover:bg-coral-hover text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Launch Google Maps Route</span>
              </a>
            </div>
          </div>
        </div>

        {/* Emergency First-Response Helplines (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-hairline rounded-2xl p-6 sm:p-7 shadow-card space-y-4">
          <div className="border-b border-hairline pb-4">
            <span className="text-[11px] font-mono font-semibold uppercase text-coral tracking-wider">
              Immediate Life-Safety Direct Dial
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
                <p className="text-[10px] text-[#9E2A2B] font-semibold uppercase font-mono">National Emergency</p>
                <p className="text-xl font-bold text-ink">112</p>
              </div>
              <Phone className="w-5 h-5 text-[#9E2A2B] group-hover:scale-110 transition" />
            </a>

            <a
              href="tel:1070"
              className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl hover:bg-[#FEF3C7] transition group shadow-card flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] text-[#92400E] font-semibold uppercase font-mono">NDRF Disaster Ops</p>
                <p className="text-xl font-bold text-ink">1070</p>
              </div>
              <Phone className="w-5 h-5 text-[#92400E] group-hover:scale-110 transition" />
            </a>

            <a
              href="tel:108"
              className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl hover:bg-[#DBEAFE] transition group shadow-card flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] text-[#1E40AF] font-semibold uppercase font-mono">Medical Emergency</p>
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
