// client/src/pages/authority/AlertStudioPage.tsx
import React, { useState } from 'react';
import {
  Radio,
  Send,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import api from '../../lib/api';
import { AlertType, SeverityLevel } from '../../types';
import { AuthoritySidebar } from '../../components/layout/AuthoritySidebar';
import { Badge } from '../../components/common/Badge';

const SOP_TEMPLATES = [
  {
    name: 'Flood Evacuation Order (Brahmaputra)',
    type: 'EVACUATION_ORDER' as AlertType,
    severity: 'CRITICAL' as SeverityLevel,
    targetArea: 'Kamrup Metropolitan & Riverbank Wards 1-14',
    lat: 26.1445,
    lng: 91.7362,
    radius: 20,
    title: 'MANDATORY EVACUATION: Brahmaputra River Overtopping',
    headline: 'IMMEDIATE EVACUATION ORDER FOR LOW-LYING SECTORS',
    message:
      'River Brahmaputra water level has crossed 52.0m threshold. Water surging through Pandu Ghat embankment breach. Evacuate immediately.',
    instructions:
      '1. Cut main electrical circuit breakers.\n2. Do not enter submerged underpasses.\n3. Proceed immediately to Nehru Stadium Relief Camp.\n4. Call 1070 for emergency boat rescue.',
  },
  {
    name: 'Cyclone Landfall Warning',
    type: 'WARNING' as AlertType,
    severity: 'HIGH' as SeverityLevel,
    targetArea: 'Guwahati & Adjacent Foothill Districts',
    lat: 26.1445,
    lng: 91.7362,
    radius: 35,
    title: 'CYCLONE WARNING: Heavy Winds and Torrential Rain Expected',
    headline: 'Winds 80-100 km/h with heavy squalls expected within 4 hours',
    message:
      'IMD radar indicates severe cyclonic depression closing in. High risk of uprooted trees and overhead power line damage.',
    instructions:
      'Remain indoors. Secure loose roof sheeting. Keep emergency lighting and 72-hour drinking water reserve accessible.',
  },
];

export const AlertStudioPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(0);
  const [title, setTitle] = useState(SOP_TEMPLATES[0].title);
  const [type, setType] = useState<AlertType>(SOP_TEMPLATES[0].type);
  const [severity, setSeverity] = useState<SeverityLevel>(SOP_TEMPLATES[0].severity);
  const [targetAreaName, setTargetAreaName] = useState(SOP_TEMPLATES[0].targetArea);
  const [targetLat, setTargetLat] = useState<string>(SOP_TEMPLATES[0].lat.toString());
  const [targetLng, setTargetLng] = useState<string>(SOP_TEMPLATES[0].lng.toString());
  const [targetRadiusKm, setTargetRadiusKm] = useState<number>(SOP_TEMPLATES[0].radius);
  const [headline, setHeadline] = useState(SOP_TEMPLATES[0].headline);
  const [detailedMessage, setDetailedMessage] = useState(SOP_TEMPLATES[0].message);
  const [actionInstructions, setActionInstructions] = useState(SOP_TEMPLATES[0].instructions);
  const [expiryHours, setExpiryHours] = useState<number>(24);

  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyTemplate = (index: number) => {
    const tmpl = SOP_TEMPLATES[index];
    setSelectedTemplate(index);
    setTitle(tmpl.title);
    setType(tmpl.type);
    setSeverity(tmpl.severity);
    setTargetAreaName(tmpl.targetArea);
    setTargetLat(tmpl.lat.toString());
    setTargetLng(tmpl.lng.toString());
    setTargetRadiusKm(tmpl.radius);
    setHeadline(tmpl.headline);
    setDetailedMessage(tmpl.message);
    setActionInstructions(tmpl.instructions);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBroadcastSuccess(null);

    try {
      setBroadcasting(true);
      const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();

      const res = await api.post('/alerts/broadcast', {
        title,
        type,
        severity,
        targetAreaName,
        targetLatitude: parseFloat(targetLat),
        targetLongitude: parseFloat(targetLng),
        targetRadiusKm: Number(targetRadiusKm),
        headline,
        detailedMessage,
        actionInstructions,
        expiresAt,
      });

      if (res.data.success) {
        setBroadcastSuccess(res.data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Broadcast dispatch failed');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="flex bg-canvas min-h-[calc(100vh-4rem)]">
      <AuthoritySidebar />

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="border-b border-hairline pb-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-coral" />
            <h1 className="text-2xl font-serif font-normal text-ink">Emergency Alert Broadcast Studio</h1>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Author and transmit geo-fenced emergency warnings across the TRINETRA real-time Server-Sent Events subscriber network.
          </p>
        </div>

        {broadcastSuccess && (
          <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between text-[#166534] text-sm shadow-card">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#166534] flex-shrink-0" />
              <div>
                <p className="font-semibold text-ink">Broadcast Successfully Dispatched via SSE</p>
                <p className="text-xs text-[#166534] font-mono">
                  Target: {broadcastSuccess.targetAreaName} • Severity: {broadcastSuccess.severity} • Radius: {broadcastSuccess.targetRadiusKm}km
                </p>
              </div>
            </div>
            <button
              onClick={() => setBroadcastSuccess(null)}
              className="text-xs bg-white border border-[#BBF7D0] px-3 py-1.5 rounded-lg text-[#166534] hover:bg-canvas transition font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-[#9E2A2B] text-sm shadow-card">
            {errorMsg}
          </div>
        )}

        {/* SOP Template Bar */}
        <div className="bg-white border border-hairline p-4 rounded-xl space-y-2 shadow-card">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-coral" />
            Standard Operating Procedure (SOP) Quick Templates
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {SOP_TEMPLATES.map((tmpl, idx) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => applyTemplate(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  selectedTemplate === idx
                    ? 'bg-coral-subtle text-coral border-coral-border shadow-sm'
                    : 'bg-canvas text-ink-body border-hairline hover:bg-canvas-subtle'
                }`}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Studio Form + Live Preview Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Authoring Form (7 cols) */}
          <form
            onSubmit={handleBroadcast}
            className="lg:col-span-7 bg-white border border-hairline rounded-xl p-6 shadow-card space-y-4"
          >
            <h3 className="text-base font-semibold text-ink border-b border-hairline pb-2">
              Broadcast Configuration
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">Alert Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AlertType)}
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
                >
                  <option value="EVACUATION_ORDER">Evacuation Order</option>
                  <option value="WARNING">Warning</option>
                  <option value="ADVISORY">Advisory</option>
                  <option value="ALL_CLEAR">All Clear</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">Severity Priority</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
                >
                  <option value="CRITICAL">Critical (Immediate Danger)</option>
                  <option value="HIGH">High (Urgent Action)</option>
                  <option value="MEDIUM">Medium (Preparatory)</option>
                  <option value="LOW">Low (Informational)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">Target Area Name</label>
              <input
                type="text"
                value={targetAreaName}
                onChange={(e) => setTargetAreaName(e.target.value)}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <span className="text-ink-subtle block mb-1">Latitude</span>
                <input
                  type="text"
                  value={targetLat}
                  onChange={(e) => setTargetLat(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg px-2.5 py-1.5 text-ink-body focus:outline-none focus:border-coral"
                />
              </div>
              <div>
                <span className="text-ink-subtle block mb-1">Longitude</span>
                <input
                  type="text"
                  value={targetLng}
                  onChange={(e) => setTargetLng(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg px-2.5 py-1.5 text-ink-body focus:outline-none focus:border-coral"
                />
              </div>
              <div>
                <span className="text-ink-subtle block mb-1">Radius: {targetRadiusKm} km</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={targetRadiusKm}
                  onChange={(e) => setTargetRadiusKm(Number(e.target.value))}
                  className="w-full accent-coral mt-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">Alert Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">Emergency Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">Detailed Message</label>
              <textarea
                value={detailedMessage}
                onChange={(e) => setDetailedMessage(e.target.value)}
                rows={3}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">Mandatory Action Directives</label>
              <textarea
                value={actionInstructions}
                onChange={(e) => setActionInstructions(e.target.value)}
                rows={3}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body font-mono focus:outline-none focus:border-coral"
                required
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-3 bg-coral hover:bg-coral-hover active:bg-coral-active text-white rounded-lg font-semibold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{broadcasting ? 'Transmitting Broadcast...' : 'Broadcast Emergency EAS Alert'}</span>
            </button>
          </form>

          {/* Live Mobile Screen Preview (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-hairline rounded-xl p-6 shadow-card space-y-4">
            <h3 className="text-base font-semibold text-ink border-b border-hairline pb-2 flex items-center justify-between">
              <span>Citizen Handset Preview</span>
              <span className="text-[10px] font-mono text-ink-subtle uppercase">Simulated Push</span>
            </h3>

            <div className="bg-canvas border border-hairline rounded-2xl p-4 shadow-inner space-y-3 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted border-b border-hairline pb-2">
                <span>GOVT OF ASSAM • EAS BROADCAST</span>
                <span>NOW</span>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  severity === 'CRITICAL'
                    ? 'bg-[#FDF2F2] border-[#F5C2C2] text-[#9E2A2B]'
                    : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Badge severity={severity} />
                  <span className="text-[10px] font-mono font-semibold uppercase">{type}</span>
                </div>
                <h4 className="text-sm font-bold text-ink leading-tight">{title}</h4>
                <p className="text-xs font-semibold text-coral">{headline}</p>
                <p className="text-xs text-ink-body leading-relaxed">{detailedMessage}</p>

                <div className="p-2.5 bg-white rounded-lg border border-hairline space-y-1">
                  <span className="text-[10px] font-mono font-semibold text-coral uppercase block">
                    Action Directives:
                  </span>
                  <p className="text-[11px] font-mono text-ink-body whitespace-pre-line leading-relaxed">
                    {actionInstructions}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-ink-muted">
                  <span>Sector: {targetAreaName}</span>
                  <span>Radius: {targetRadiusKm}km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
