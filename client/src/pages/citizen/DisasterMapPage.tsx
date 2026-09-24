// client/src/pages/citizen/DisasterMapPage.tsx
import React, { useState, useEffect } from 'react';
import { DisasterLeafletMap } from '../../components/map/DisasterLeafletMap';
import api from '../../lib/api';
import { Disaster, SafeZone, EmergencyResource, IncidentReport } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { MapPin, Navigation, Info } from 'lucide-react';

export const DisasterMapPage: React.FC = () => {
  const { latitude, longitude, refetchLocation, loading: geoLoading } = useGeolocation();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);

  useEffect(() => {
    const fetchMapLayers = async () => {
      try {
        const [disastersRes, safeZonesRes, resourcesRes, reportsRes] = await Promise.all([
          api.get('/disasters'),
          api.get('/safe-zones'),
          api.get('/resources'),
          api.get('/reports?status=ALL'),
        ]);

        if (disastersRes.data.success) setDisasters(disastersRes.data.data);
        if (safeZonesRes.data.success) setSafeZones(safeZonesRes.data.data);
        if (resourcesRes.data.success) setResources(resourcesRes.data.data);
        if (reportsRes.data.success) setReports(reportsRes.data.data);
      } catch (err) {
        console.error('Failed to load map layers:', err);
      }
    };

    fetchMapLayers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-normal text-ink flex items-center gap-2">
            <MapPin className="w-5 h-5 text-coral" />
            <span>Interactive Situational GIS Map</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Real-time geospatial visualization of active hazard buffers, relief shelters, hospitals, and citizen eyewitness reports.
          </p>
        </div>

        <button
          onClick={refetchLocation}
          disabled={geoLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-canvas text-ink border border-hairline rounded-lg text-xs font-semibold transition shadow-card"
        >
          <Navigation className={`w-3.5 h-3.5 text-coral ${geoLoading ? 'animate-spin' : ''}`} />
          <span>{geoLoading ? 'Acquiring GPS...' : 'Center on My GPS'}</span>
        </button>
      </div>

      {/* Full-width Map Container */}
      <DisasterLeafletMap
        disasters={disasters}
        safeZones={safeZones}
        resources={resources}
        reports={reports}
        userLat={latitude}
        userLng={longitude}
        height="700px"
        zoom={12}
      />

      {/* Bottom Info Bar */}
      <div className="bg-white border border-hairline p-4 rounded-xl flex flex-wrap items-center justify-between text-xs text-ink-muted gap-4 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C64545]" />
            Active Flood Buffer ({disasters.length})
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            Verified Safe Camp ({safeZones.length})
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            Medical / NDRF Base ({resources.length})
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-body">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            Citizen Incident Pin ({reports.length})
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px] text-ink-subtle">
          <Info className="w-3.5 h-3.5 text-ink-subtle" />
          <span>WGS-84 Coordinate Standard • OpenStreetMap & CARTO Tiles</span>
        </div>
      </div>
    </div>
  );
};
