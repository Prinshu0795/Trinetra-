// client/src/pages/authority/ResourceManagePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ShieldCheck,
  Plus,
  Minus,
  Building2,
} from 'lucide-react';
import api from '../../lib/api';
import { SafeZone, EmergencyResource } from '../../types';
import { Badge } from '../../components/common/Badge';
import { AuthoritySidebar } from '../../components/layout/AuthoritySidebar';

export const ResourceManagePage: React.FC = () => {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [szRes, resRes] = await Promise.all([
        api.get('/safe-zones'),
        api.get('/resources'),
      ]);
      if (szRes.data.success) setSafeZones(szRes.data.data);
      if (resRes.data.success) setResources(resRes.data.data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateOccupancy = async (sz: SafeZone, delta: number) => {
    const newOccupied = Math.max(0, Math.min(sz.capacityTotal, sz.capacityOccupied + delta));
    try {
      setUpdatingId(sz.id);
      const res = await api.patch(`/safe-zones/${sz.id}/occupancy`, {
        capacityOccupied: newOccupied,
      });
      if (res.data.success) {
        setSafeZones((prev) =>
          prev.map((item) => (item.id === sz.id ? res.data.data : item))
        );
      }
    } catch (err) {
      console.error('Failed to update occupancy:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateResourceStatus = async (resItem: EmergencyResource, newStatus: string) => {
    try {
      setUpdatingId(resItem.id);
      const res = await api.patch(`/resources/${resItem.id}`, {
        status: newStatus,
      });
      if (res.data.success) {
        setResources((prev) =>
          prev.map((item) => (item.id === resItem.id ? res.data.data : item))
        );
      }
    } catch (err) {
      console.error('Failed to update resource status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex bg-canvas min-h-[calc(100vh-4rem)]">
      <AuthoritySidebar />

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="border-b border-hairline pb-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-[#166534]" />
            <span className="text-xs font-mono font-semibold text-coral uppercase tracking-widest">
              State Relief Logistics & Safe Haven Operations
            </span>
          </div>
          <h1 className="text-2xl font-serif font-normal text-ink tracking-tight mt-1">
            Shelter Capacities & Emergency Response Units
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Dynamic control over relief camp intake, evacuee bed counts, and specialized NDRF/SDRF deployment readiness.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-ink-muted text-xs font-mono animate-pulse">
            Loading logistics and shelter capacities...
          </div>
        ) : (
          <>
            {/* Safe Zones Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-serif font-normal text-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#166534]" />
                  <span>Designated Evacuation Shelters ({safeZones.length})</span>
                </h2>
                <span className="text-xs font-mono text-ink-muted">
                  Total Capacity: {safeZones.reduce((acc, s) => acc + s.capacityTotal, 0).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safeZones.map((sz) => {
                  const occupancyPct = Math.round((sz.capacityOccupied / sz.capacityTotal) * 100);
                  const isNearCapacity = occupancyPct > 85;

                  return (
                    <div
                      key={sz.id}
                      className="bg-white border border-hairline rounded-xl p-5 space-y-4 shadow-card hover:border-hairline-dark transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-ink text-sm">{sz.name}</h3>
                          <p className="text-xs text-ink-muted font-mono mt-0.5">{sz.locationName}</p>
                        </div>
                        <Badge status={sz.status} />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-ink-muted font-mono">
                          <span>Occupancy</span>
                          <span className={isNearCapacity ? 'text-[#9E2A2B] font-bold' : 'text-ink'}>
                            {sz.capacityOccupied} / {sz.capacityTotal} ({occupancyPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-canvas h-2 rounded-full overflow-hidden border border-hairline">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isNearCapacity ? 'bg-[#9E2A2B]' : 'bg-[#166534]'
                            }`}
                            style={{ width: `${Math.min(100, occupancyPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Increment/Decrement Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-hairline">
                        <span className="text-xs text-ink-muted font-medium">Camp Intake:</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleUpdateOccupancy(sz, -25)}
                            disabled={updatingId === sz.id || sz.capacityOccupied <= 0}
                            className="p-1.5 bg-white hover:bg-canvas text-ink border border-hairline rounded-md text-xs font-bold disabled:opacity-40 shadow-sm transition"
                            title="Decrease intake by 25"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-14 text-center font-mono text-xs font-bold text-ink bg-canvas py-1 px-1 rounded border border-hairline">
                            {sz.capacityOccupied}
                          </span>
                          <button
                            onClick={() => handleUpdateOccupancy(sz, 25)}
                            disabled={updatingId === sz.id || sz.capacityOccupied >= sz.capacityTotal}
                            className="p-1.5 bg-white hover:bg-canvas text-ink border border-hairline rounded-md text-xs font-bold disabled:opacity-40 shadow-sm transition"
                            title="Increase intake by 25"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resources Section */}
            <div className="space-y-4 pt-4 border-t border-hairline">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-serif font-normal text-ink flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-coral" />
                  <span>Emergency Deployment Units & Response Squads ({resources.length})</span>
                </h2>
                <span className="text-xs font-mono text-ink-muted">
                  Ready: {resources.filter((r) => r.status === 'AVAILABLE').length} / {resources.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resources.map((resItem) => (
                  <div
                    key={resItem.id}
                    className="bg-white border border-hairline rounded-xl p-5 space-y-3 shadow-card hover:border-hairline-dark transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-ink text-sm">{resItem.name}</h3>
                        <p className="text-xs text-ink-muted font-mono mt-0.5">{resItem.locationName}</p>
                      </div>
                      <Badge status={resItem.status} />
                    </div>

                    <p className="text-xs text-ink-muted bg-canvas p-2.5 rounded-lg border border-hairline leading-relaxed">
                      {resItem.details}
                    </p>

                    <div className="pt-2.5 border-t border-hairline flex items-center justify-between">
                      <span className="text-xs text-ink-muted font-medium">Readiness:</span>
                      <select
                        value={resItem.status}
                        onChange={(e) => handleUpdateResourceStatus(resItem, e.target.value)}
                        disabled={updatingId === resItem.id}
                        className="bg-white border border-hairline text-xs font-mono text-ink rounded-lg px-2.5 py-1 focus:outline-none focus:border-coral transition shadow-sm"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="ENGAGED">ENGAGED</option>
                        <option value="DEPLETED">DEPLETED</option>
                        <option value="STANDBY">STANDBY</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
