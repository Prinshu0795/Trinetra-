// client/src/components/map/DisasterLeafletMap.tsx
import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Disaster, SafeZone, EmergencyResource, IncidentReport } from '../../types';
import { Badge } from '../common/Badge';

// Custom SVG Icons for Leaflet markers
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        color: #FFFFFF;
        font-size: 14px;
        font-weight: 600;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="position: absolute; width: 20px; height: 20px; background-color: #CC785C; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(204,120,92,0.6);"></div>
      <div style="position: absolute; width: 40px; height: 40px; top: -10px; left: -10px; background-color: rgba(204,120,92,0.25); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to dynamically recenter map
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface DisasterLeafletMapProps {
  disasters?: Disaster[];
  safeZones?: SafeZone[];
  resources?: EmergencyResource[];
  reports?: IncidentReport[];
  userLat?: number | null;
  userLng?: number | null;
  height?: string;
  zoom?: number;
  initialCenter?: [number, number];
  onReportClick?: (report: IncidentReport) => void;
}

export const DisasterLeafletMap: React.FC<DisasterLeafletMapProps> = ({
  disasters = [],
  safeZones = [],
  resources = [],
  reports = [],
  userLat,
  userLng,
  height = '600px',
  zoom = 12,
  initialCenter = [26.1445, 91.7362], // Guwahati default
  onReportClick,
}) => {
  const [showDisasters, setShowDisasters] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showReports, setShowReports] = useState(true);

  const center: [number, number] =
    userLat && userLng ? [userLat, userLng] : initialCenter;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-hairline shadow-card" style={{ height }}>
      {/* Map Interactive Layer Toggle HUD */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-hairline p-3.5 rounded-xl shadow-elevated flex flex-col space-y-2 text-xs">
        <span className="font-semibold text-ink tracking-wider uppercase mb-0.5 text-[11px]">Active GIS Layers</span>
        <label className="flex items-center space-x-2 cursor-pointer text-ink-body hover:text-ink">
          <input
            type="checkbox"
            checked={showDisasters}
            onChange={(e) => setShowDisasters(e.target.checked)}
            className="rounded border-hairline text-coral focus:ring-0"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#C64545]" />
            Disaster Epicenters & Radius
          </span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer text-ink-body hover:text-ink">
          <input
            type="checkbox"
            checked={showSafeZones}
            onChange={(e) => setShowSafeZones(e.target.checked)}
            className="rounded border-hairline text-[#166534] focus:ring-0"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            Safe Zones & Shelters ({safeZones.length})
          </span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer text-ink-body hover:text-ink">
          <input
            type="checkbox"
            checked={showResources}
            onChange={(e) => setShowResources(e.target.checked)}
            className="rounded border-hairline text-[#1E40AF] focus:ring-0"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            Emergency Resources ({resources.length})
          </span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer text-ink-body hover:text-ink">
          <input
            type="checkbox"
            checked={showReports}
            onChange={(e) => setShowReports(e.target.checked)}
            className="rounded border-hairline text-[#D97706] focus:ring-0"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            Citizen Incident Reports ({reports.length})
          </span>
        </label>
      </div>

      {/* Main Leaflet Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <ChangeView center={center} zoom={zoom} />

        {/* Standard OpenStreetMap Cartography */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Geolocation Marker */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={userIcon}>
            <Popup className="custom-popup">
              <div className="p-1">
                <p className="font-semibold text-ink text-xs">Your Current Location</p>
                <p className="text-[10px] text-ink-muted font-mono mt-0.5">
                  {userLat.toFixed(4)}°N, {userLng.toFixed(4)}°E
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 1. Active Disasters and Circular Impact Buffers */}
        {showDisasters &&
          disasters.map((d) => (
            <React.Fragment key={d.id}>
              <Circle
                center={[d.latitude, d.longitude]}
                radius={d.radiusKm * 1000}
                pathOptions={{
                  color: d.severity === 'CRITICAL' ? '#CC785C' : '#D97706',
                  fillColor: d.severity === 'CRITICAL' ? '#CC785C' : '#D97706',
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
              <Marker
                position={[d.latitude, d.longitude]}
                icon={createCustomIcon('#C64545', '⚠️')}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-1.5 max-w-xs">
                    <Badge severity={d.severity} />
                    <h4 className="font-semibold text-ink text-sm">{d.title}</h4>
                    <p className="text-xs text-ink-body line-clamp-2">{d.description}</p>
                    <div className="text-[11px] text-ink-muted pt-1 border-t border-hairline">
                      <p><strong>Radius:</strong> {d.radiusKm} km</p>
                      <p><strong>Affected Pop.:</strong> ~{d.affectedPopulationEst.toLocaleString()}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

        {/* 2. Safe Zones */}
        {showSafeZones &&
          safeZones.map((sz) => (
            <Marker
              key={sz.id}
              position={[sz.latitude, sz.longitude]}
              icon={createCustomIcon('#166534', '🛡️')}
            >
              <Popup className="custom-popup">
                <div className="p-2 space-y-1 max-w-xs">
                  <Badge status={sz.status} />
                  <h4 className="font-semibold text-ink text-sm">{sz.name}</h4>
                  <p className="text-xs text-ink-muted">{sz.locationName}</p>
                  <div className="text-xs text-ink-body pt-1 space-y-0.5">
                    <p>
                      <strong>Capacity:</strong> {sz.capacityOccupied} / {sz.capacityTotal}
                    </p>
                    {sz.elevationMeters && (
                      <p><strong>Elevation:</strong> {sz.elevationMeters}m MSL</p>
                    )}
                    {sz.contactPhone && (
                      <p><strong>Contact:</strong> {sz.contactPhone}</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 3. Emergency Resources / Hospitals */}
        {showResources &&
          resources.map((resItem) => (
            <Marker
              key={resItem.id}
              position={[resItem.latitude, resItem.longitude]}
              icon={createCustomIcon('#1E40AF', '🏥')}
            >
              <Popup className="custom-popup">
                <div className="p-2 space-y-1 max-w-xs">
                  <Badge status={resItem.status} />
                  <h4 className="font-semibold text-ink text-sm">{resItem.name}</h4>
                  <p className="text-xs text-ink-body">{resItem.details}</p>
                  <p className="text-xs font-semibold text-[#1E40AF]">
                    📞 {resItem.contactNumber}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. Citizen Incident Reports */}
        {showReports &&
          reports.map((rpt) => (
            <Marker
              key={rpt.id}
              position={[rpt.latitude, rpt.longitude]}
              icon={createCustomIcon(
                rpt.status === 'VERIFIED' ? '#D97706' : '#B45309',
                '📍'
              )}
              eventHandlers={{
                click: () => onReportClick && onReportClick(rpt),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 space-y-1 max-w-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-ink-muted font-bold">{rpt.trackingCode}</span>
                    <Badge status={rpt.status} />
                  </div>
                  <h4 className="font-semibold text-ink text-sm">{rpt.title}</h4>
                  <p className="text-xs text-ink-body line-clamp-2">{rpt.description}</p>
                  {rpt.imageUrl && (
                    <img
                      src={rpt.imageUrl}
                      alt="Incident proof"
                      className="w-full h-24 object-cover rounded-md mt-1 border border-hairline"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};
