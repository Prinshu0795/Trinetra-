// client/src/pages/authority/DisasterManagePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { Disaster, DisasterType, SeverityLevel, DisasterStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { AuthoritySidebar } from '../../components/layout/AuthoritySidebar';

export const DisasterManagePage: React.FC = () => {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DisasterType>('FLOOD');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('26.1445');
  const [longitude, setLongitude] = useState('91.7362');
  const [radiusKm, setRadiusKm] = useState(15);
  const [description, setDescription] = useState('');
  const [affectedPopulationEst, setAffectedPopulationEst] = useState(50000);
  const [submitting, setSubmitting] = useState(false);

  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/disasters');
      if (res.data.success) {
        setDisasters(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load disasters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  const handleCreateDisaster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/disasters', {
        title,
        type,
        severity,
        locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusKm,
        description,
        affectedPopulationEst,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        // Reset form
        setTitle('');
        setLocationName('');
        setDescription('');
        fetchDisasters();
      }
    } catch (err) {
      console.error('Failed to create disaster:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: DisasterStatus) => {
    try {
      const res = await api.patch(`/disasters/${id}`, { status: newStatus });
      if (res.data.success) {
        setDisasters((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    } catch (err) {
      console.error('Failed to update disaster status:', err);
    }
  };

  return (
    <div className="flex bg-canvas min-h-[calc(100vh-4rem)]">
      <AuthoritySidebar />

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-coral" />
              <span className="text-xs font-mono font-semibold text-coral uppercase tracking-widest">
                Disaster Event Registry & Lifecycle
              </span>
            </div>
            <h1 className="text-2xl font-serif font-normal text-ink tracking-tight mt-1">
              Hazard Declarations & Perimeter Management
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              Officially declare active emergency zones, calibrate operational impact radii, and coordinate disaster de-escalation.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-coral hover:bg-coral-hover active:bg-coral-active text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Declare New Disaster</span>
          </button>
        </div>

        {/* Disaster Cards List */}
        {loading ? (
          <div className="py-16 text-center text-ink-muted text-xs font-mono animate-pulse">
            Loading active incident records...
          </div>
        ) : disasters.length === 0 ? (
          <div className="p-8 text-center bg-white border border-hairline rounded-xl">
            <p className="text-sm font-semibold text-ink">No active disaster events declared</p>
            <p className="text-xs text-ink-muted mt-1">Click above to initiate a new state-level emergency declaration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {disasters.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-hairline rounded-xl p-6 space-y-4 shadow-card hover:border-hairline-dark transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge severity={d.severity} />
                      <span className="text-xs font-mono font-semibold text-ink-muted uppercase">
                        {d.type}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-ink mt-2">{d.title}</h3>
                    <p className="text-xs text-ink-muted flex items-center gap-1.5 mt-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-coral shrink-0" />
                      <span>{d.locationName}</span>
                    </p>
                  </div>
                  <Badge status={d.status} />
                </div>

                <p className="text-xs text-ink-muted bg-canvas p-3 rounded-lg border border-hairline leading-relaxed">
                  {d.description}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-canvas p-2.5 rounded-lg border border-hairline">
                    <span className="text-[10px] text-ink-muted block uppercase">Radius</span>
                    <span className="text-ink font-bold">{d.radiusKm} km</span>
                  </div>
                  <div className="bg-canvas p-2.5 rounded-lg border border-hairline">
                    <span className="text-[10px] text-ink-muted block uppercase">Affected</span>
                    <span className="text-ink font-bold">~{d.affectedPopulationEst.toLocaleString()}</span>
                  </div>
                  <div className="bg-canvas p-2.5 rounded-lg border border-hairline">
                    <span className="text-[10px] text-ink-muted block uppercase">Alerts</span>
                    <span className="text-ink font-bold">{d.alertCount ?? 0}</span>
                  </div>
                </div>

                {/* Status Change Selector */}
                <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
                  <span className="text-ink-muted font-medium">Event Lifecycle:</span>
                  <div className="flex space-x-1.5">
                    {(['ACTIVE', 'CONTAINED', 'RESOLVED'] as DisasterStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusUpdate(d.id, st)}
                        className={`px-3 py-1 rounded-md font-mono text-[11px] font-semibold transition border ${
                          d.status === st
                            ? 'bg-coral text-white border-coral shadow-sm'
                            : 'bg-white text-ink-muted border-hairline hover:border-hairline-dark hover:text-ink'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Declare New Disaster */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-hairline rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div>
                  <h2 className="text-lg font-serif font-normal text-ink">Declare Emergency Disaster</h2>
                  <p className="text-xs text-ink-muted">Establishes GIS perimeter and triggers priority triage alert workflows.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-ink-muted hover:text-ink rounded-md transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDisaster} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-ink font-semibold mb-1">Disaster Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flash Flooding & Embankment Collapse"
                    className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-ink font-semibold mb-1">Disaster Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as DisasterType)}
                      className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                    >
                      <option value="FLOOD">FLOOD</option>
                      <option value="CYCLONE">CYCLONE</option>
                      <option value="LANDSLIDE">LANDSLIDE</option>
                      <option value="EARTHQUAKE">EARTHQUAKE</option>
                      <option value="WILDFIRE">WILDFIRE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-ink font-semibold mb-1">Initial Severity</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                      className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-ink font-semibold mb-1">Location / District</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Guwahati, Kamrup Metropolitan"
                    className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="block text-ink font-sans font-semibold mb-1">Latitude</label>
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full bg-white border border-hairline rounded-lg px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-coral transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-ink font-sans font-semibold mb-1">Longitude</label>
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full bg-white border border-hairline rounded-lg px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-coral transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-ink font-sans font-semibold mb-1">Radius (km)</label>
                    <input
                      type="number"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-hairline rounded-lg px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-coral transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ink font-semibold mb-1">Situation Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                    placeholder="Provide actionable situation intelligence..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-white hover:bg-canvas text-ink-muted border border-hairline rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-coral hover:bg-coral-hover active:bg-coral-active text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Declare Disaster'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
