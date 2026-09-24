// client/src/pages/authority/AuthorityDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Radio,
  Users,
  RotateCcw,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import api from '../../lib/api';
import { Disaster, IncidentReport, Alert, SafeZone } from '../../types';
import { Badge } from '../../components/common/Badge';
import { DisasterLeafletMap } from '../../components/map/DisasterLeafletMap';
import { AuthoritySidebar } from '../../components/layout/AuthoritySidebar';
import { useAuth } from '../../context/AuthContext';

export const AuthorityDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const fetchCommandData = async () => {
    try {
      const [disastersRes, reportsRes, alertsRes, safeZonesRes] = await Promise.all([
        api.get('/disasters'),
        api.get('/reports?status=ALL'),
        api.get('/alerts?status=ACTIVE'),
        api.get('/safe-zones'),
      ]);

      if (disastersRes.data.success) setDisasters(disastersRes.data.data);
      if (reportsRes.data.success) setReports(reportsRes.data.data);
      if (alertsRes.data.success) setAlerts(alertsRes.data.data);
      if (safeZonesRes.data.success) setSafeZones(safeZonesRes.data.data);
    } catch (err) {
      console.error('Failed to load authority command telemetry:', err);
    }
  };

  useEffect(() => {
    fetchCommandData();
    const interval = setInterval(fetchCommandData, 10000); // 10s polling backup
    return () => clearInterval(interval);
  }, []);

  const handleResetScenario = async () => {
    if (!window.confirm('Reset database to clean Brahmaputra Flood demo scenario?')) return;
    try {
      setResetting(true);
      const res = await api.post('/dev/reset-scenario');
      if (res.data.success) {
        setResetSuccess('Scenario reset successfully!');
        await fetchCommandData();
        setTimeout(() => setResetSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to reset scenario:', err);
    } finally {
      setResetting(false);
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'PENDING_VERIFICATION');
  const totalEvacuees = safeZones.reduce((sum, sz) => sum + sz.capacityOccupied, 0);
  const criticalDisastersCount = disasters.filter((d) => d.severity === 'CRITICAL').length;
  const evacuationOrdersCount = alerts.filter((a) => a.type === 'EVACUATION_ORDER' || a.severity === 'CRITICAL').length;

  return (
    <div className="flex bg-canvas min-h-[calc(100vh-4rem)]">
      <AuthoritySidebar />

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-[#22C55E]" />
              <span className="text-xs font-mono font-semibold text-coral uppercase tracking-widest">
                ASDMA / NDRF State Emergency Operations Center (SEOC)
              </span>
            </div>
            <h1 className="text-2xl font-serif font-normal text-ink tracking-tight mt-1">
              Incident Command & Situational Control Desk
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {resetSuccess && (
              <span className="text-xs text-[#166534] font-medium animate-fade-in">
                ✓ {resetSuccess}
              </span>
            )}
            <button
              onClick={handleResetScenario}
              disabled={resetting}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-canvas text-ink border border-hairline rounded-lg text-xs font-semibold shadow-card transition"
              title="One-click deterministic reset for SIH jury presentation"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-coral ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reset Demo Scenario'}</span>
            </button>

            {user?.role === 'AUTHORITY' && (
              <Link
                to="/authority/alerts"
                className="flex items-center space-x-1.5 px-4 py-2 bg-coral hover:bg-coral-hover active:bg-coral-active text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Radio className="w-4 h-4" />
                <span>Publish EAS Alert</span>
              </Link>
            )}
          </div>
        </div>

        {/* 1. Command KPI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-hairline p-4 rounded-xl space-y-1 shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted font-semibold uppercase">
              <span>Active Disasters</span>
              <Flame className="w-4 h-4 text-coral" />
            </div>
            <p className="text-3xl font-bold text-ink">{disasters.length}</p>
            <p className="text-[11px] text-[#9E2A2B] font-mono">
              {criticalDisastersCount} CRITICAL Severity
            </p>
          </div>

          <div className="bg-white border border-hairline p-4 rounded-xl space-y-1 shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted font-semibold uppercase">
              <span>Pending Triage</span>
              <ClipboardList className="w-4 h-4 text-[#D97706]" />
            </div>
            <p className="text-3xl font-bold text-ink">{pendingReports.length}</p>
            <Link to="/authority/triage" className="text-[11px] text-coral hover:underline flex items-center gap-1 font-medium">
              <span>Review Incoming Feed →</span>
            </Link>
          </div>

          <div className="bg-white border border-hairline p-4 rounded-xl space-y-1 shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted font-semibold uppercase">
              <span>Live Broadcasts</span>
              <Radio className="w-4 h-4 text-[#1E40AF]" />
            </div>
            <p className="text-3xl font-bold text-ink">{alerts.length}</p>
            <p className="text-[11px] text-[#166534] font-mono">
              {evacuationOrdersCount} Active Order{evacuationOrdersCount === 1 ? '' : 's'}
            </p>
          </div>

          <div className="bg-white border border-hairline p-4 rounded-xl space-y-1 shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted font-semibold uppercase">
              <span>Total Sheltered</span>
              <Users className="w-4 h-4 text-[#166534]" />
            </div>
            <p className="text-3xl font-bold text-ink">{totalEvacuees.toLocaleString()}</p>
            <p className="text-[11px] text-ink-muted font-mono">Across {safeZones.length} Designated Camps</p>
          </div>
        </div>

        {/* 2. Split Screen: Incoming Triage Stream (Left) + Interactive GIS Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Incident Reports Triage Stream (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-hairline rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-card">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-coral" />
                  <h3 className="text-base font-semibold text-ink">Live Ground Intel Feed</h3>
                </div>
                <Link
                  to="/authority/triage"
                  className="text-xs text-coral hover:underline font-semibold"
                >
                  Open Full Triage Board →
                </Link>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {reports.slice(0, 5).map((rpt) => (
                  <div
                    key={rpt.id}
                    className="p-3.5 bg-canvas border border-hairline rounded-lg space-y-1.5 hover:bg-canvas-subtle transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-coral">{rpt.trackingCode}</span>
                      <Badge status={rpt.status} />
                    </div>
                    <h4 className="text-sm font-semibold text-ink leading-tight">{rpt.title}</h4>
                    <p className="text-xs text-ink-body line-clamp-2">{rpt.description}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-hairline text-[11px] text-ink-muted">
                      <span>{rpt.locationName}</span>
                      <span className="font-mono">{new Date(rpt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/authority/triage"
              className="w-full py-2 bg-white hover:bg-canvas text-ink border border-hairline text-xs font-semibold rounded-lg text-center transition shadow-card"
            >
              Manage & Verify Citizen Reports ({pendingReports.length} Pending)
            </Link>
          </div>

          {/* Right: Real-time Hazard Map (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-hairline rounded-xl p-5 space-y-3 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#166534]" />
                <span>Tactical Operational Picture</span>
              </h3>
              <span className="text-xs text-ink-muted font-mono">Brahmaputra Basin Sector</span>
            </div>

            <DisasterLeafletMap
              disasters={disasters}
              safeZones={safeZones}
              reports={reports}
              height="520px"
              zoom={12}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
