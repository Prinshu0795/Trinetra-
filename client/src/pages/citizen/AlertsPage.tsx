// client/src/pages/citizen/AlertsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  Clock,
  MapPin,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import api from '../../lib/api';
import { Alert } from '../../types';
import { Badge } from '../../components/common/Badge';
import { alertAudio } from '../../lib/audio';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts?status=ACTIVE');
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity === 'ALL') return true;
    return a.severity === selectedSeverity;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-normal text-ink flex items-center gap-2">
            <Bell className="w-5 h-5 text-coral" />
            <span>Emergency Broadcast Alert Center</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Authoritative, time-bound warnings issued by State and National Disaster Management Authorities.
          </p>
        </div>

        {/* Audio Test & Toggle */}
        <button
          onClick={() => alertAudio.playEmergencyTone(1000)}
          className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-canvas text-ink border border-hairline rounded-lg text-xs font-semibold transition shadow-card"
        >
          <Volume2 className="w-4 h-4 text-[#166534]" />
          <span>Test EAS Sounder</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-hairline pb-3 overflow-x-auto text-xs font-semibold">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(sev)}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              selectedSeverity === sev
                ? 'bg-coral text-white shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-canvas-subtle'
            }`}
          >
            {sev} ({sev === 'ALL' ? alerts.length : alerts.filter((a) => a.severity === sev).length})
          </button>
        ))}
      </div>

      {/* Alert Stream Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-ink-muted">Loading active broadcasts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white border border-hairline rounded-xl shadow-card">
            <CheckCircle className="w-10 h-10 text-[#166534] mx-auto mb-2" />
            <p className="text-ink font-semibold">No Active Alerts In This Category</p>
            <p className="text-xs text-ink-muted mt-1">Check back for updated regional notices.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 rounded-xl border bg-white shadow-card transition space-y-4 border-l-4 ${
                alert.severity === 'CRITICAL'
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
                <div className="flex items-center space-x-3 text-xs text-ink-muted font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-ink-subtle" />
                    Expires: {new Date(alert.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>Radius: {alert.targetRadiusKm} km</span>
                </div>
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
