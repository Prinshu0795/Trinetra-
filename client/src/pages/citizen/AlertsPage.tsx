// client/src/pages/citizen/AlertsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Volume2,
  Clock,
  MapPin,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import api from '../../lib/api';
import { Alert } from '../../types';
import { Badge } from '../../components/common/Badge';
import { alertAudio } from '../../lib/audio';
import { useGeolocation } from '../../hooks/useGeolocation';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const AlertsPage: React.FC = () => {
  const { latitude, longitude } = useGeolocation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [proximityFilter, setProximityFilter] = useState<'NEAR' | 'ALL'>('ALL');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      let loadedAlerts: Alert[] = [];

      try {
        const res = await api.get('/alerts?status=ACTIVE');
        if (res.data?.success) {
          loadedAlerts = res.data.data;
        }
      } catch (backendErr) {
        const { isSupabaseConfigured, supabaseGetAlerts } = await import('../../lib/supabase');
        if (isSupabaseConfigured) {
          const supaAlerts = await supabaseGetAlerts();
          loadedAlerts = supaAlerts as any;
        } else {
          throw backendErr;
        }
      }

      setAlerts(loadedAlerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Compute distance and threat status for each alert relative to current sector
  const alertsWithDistance = useMemo(() => {
    return alerts.map((a) => {
      let distKm = 0;
      let isInsideRadius = false;

      if (latitude && longitude && a.targetLatitude && a.targetLongitude) {
        distKm = Number(
          calculateDistanceKm(latitude, longitude, a.targetLatitude, a.targetLongitude).toFixed(1)
        );
        isInsideRadius = distKm <= a.targetRadiusKm;
      }

      return {
        ...a,
        distKm,
        isInsideRadius,
      };
    });
  }, [alerts, latitude, longitude]);

  const nearCount = alertsWithDistance.filter((a) => a.distKm <= 50).length;

  const filteredAlerts = alertsWithDistance.filter((a) => {
    if (proximityFilter === 'NEAR' && a.distKm > 50) return false;
    if (selectedSeverity === 'ALL') return true;
    return a.severity === selectedSeverity;
  });

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Title & EAS Audio Sounder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-normal text-ink flex items-center gap-2">
            <Bell className="w-5 h-5 text-coral shrink-0" />
            <span>Emergency Broadcast Alert Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Authoritative, time-bound warnings issued by State and National Disaster Management Authorities.
          </p>
        </div>

        {/* Audio Test & Toggle */}
        <button
          onClick={() => alertAudio.playEmergencyTone(1000)}
          className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-canvas text-ink border border-hairline rounded-xl text-xs font-semibold transition shadow-card"
        >
          <Volume2 className="w-4 h-4 text-[#166534]" />
          <span>Test EAS Sounder</span>
        </button>
      </div>

      {/* Filter Tabs & Proximity Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
        {/* Severity Tabs (Horizontal scroll on mobile) */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                selectedSeverity === sev
                  ? 'bg-coral text-white shadow-sm'
                  : 'bg-white hover:bg-canvas text-ink-muted hover:text-ink border border-hairline'
              }`}
            >
              {sev} ({sev === 'ALL' ? alerts.length : alerts.filter((a) => a.severity === sev).length})
            </button>
          ))}
        </div>

        {/* Proximity Filter Toggle */}
        <div className="flex items-center space-x-1 bg-canvas p-1 rounded-xl border border-hairline self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setProximityFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              proximityFilter === 'ALL'
                ? 'bg-white shadow-sm text-ink font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setProximityFilter('NEAR')}
            className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              proximityFilter === 'NEAR'
                ? 'bg-white shadow-sm text-coral font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Near Sector ({nearCount})
          </button>
        </div>
      </div>

      {/* Alert Stream Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-ink-muted">Loading active broadcasts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-10 text-center bg-white border border-hairline rounded-xl shadow-card space-y-3">
            <CheckCircle className="w-10 h-10 text-[#166534] mx-auto" />
            <h3 className="text-base font-semibold text-ink">
              No Active Alerts In Your Immediate Area
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
              All clear. Your location is outside active disaster warning perimeters.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setProximityFilter('ALL')}
                className="px-3.5 py-1.5 bg-canvas hover:bg-canvas-subtle text-ink border border-hairline rounded-lg text-xs font-semibold transition"
              >
                View All National Broadcasts ({alerts.length})
              </button>
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 rounded-xl border bg-white shadow-card transition space-y-4 border-l-4 ${
                alert.isInsideRadius
                  ? 'border-hairline border-l-[#C64545] ring-1 ring-[#C64545]/20'
                  : alert.severity === 'CRITICAL'
                  ? 'border-hairline border-l-[#C64545]'
                  : alert.severity === 'HIGH'
                  ? 'border-hairline border-l-[#D97706]'
                  : 'border-hairline border-l-coral'
              }`}
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Badge severity={alert.severity} />
                  <span className="text-xs font-mono font-semibold tracking-wider text-ink-muted uppercase">
                    {alert.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center space-x-3 text-xs text-ink-muted font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-ink-subtle" />
                    Expires: {new Date(alert.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>Radius: {alert.targetRadiusKm} km</span>
                </div>
              </div>

              {/* Proximity / Distance Alert Pill */}
              <div className="flex items-center gap-2">
                {alert.isInsideRadius ? (
                  <span className="inline-flex items-center gap-1.5 bg-[#FDF2F2] border border-[#F5C2C2] text-[#9E2A2B] px-2.5 py-1 rounded-md text-xs font-mono font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C64545]" />
                    <span>⚠️ IMMINENT DANGER: You are inside the impact buffer ({alert.distKm} km from epicenter)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-canvas border border-hairline text-ink-muted px-2.5 py-0.5 rounded text-xs font-mono">
                    <MapPin className="w-3.5 h-3.5 text-ink-subtle" />
                    <span>📍 Epicenter is {alert.distKm} km away • Outside threat buffer</span>
                  </span>
                )}
              </div>

              {/* Title & Headline */}
              <div>
                <h3 className="text-lg font-semibold text-ink">{alert.title}</h3>
                <p className="text-sm font-semibold text-coral mt-1">{alert.headline}</p>
              </div>

              {/* Detailed Content */}
              <p className="text-sm text-ink-body leading-relaxed whitespace-pre-line">
                {alert.detailedMessage}
              </p>

              {/* Action Directives Box */}
              <div className="p-4 bg-canvas border border-hairline rounded-lg space-y-2">
                <p className="text-xs font-semibold text-coral uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Mandatory Action Directives
                </p>
                <div className="text-xs text-ink-body whitespace-pre-line leading-relaxed font-mono">
                  {alert.actionInstructions}
                </div>
              </div>

              {/* Source Provenance */}
              <div className="flex items-center justify-between pt-3 border-t border-hairline text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-coral" />
                  Target: <strong className="text-ink-body">{alert.targetAreaName}</strong>
                </span>
                <span>Source: {alert.source}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
