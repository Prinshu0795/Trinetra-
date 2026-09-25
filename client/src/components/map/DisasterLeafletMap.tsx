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

// India Geographic Bounding Box (Kashmir to Kanyakumari, Gujarat to Arunachal)
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [8.0, 68.0],
  [36.5, 97.4],
];

// Component to dynamically recenter map or fit whole India
function ChangeView({
  center,
  zoom,
  fitPanIndia,
}: {
  center: [number, number];
  zoom: number;
  fitPanIndia?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (fitPanIndia) {
      map.fitBounds(INDIA_BOUNDS, { padding: [16, 16], maxZoom: 6 });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, fitPanIndia, map]);
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
  center?: [number, number];
  initialCenter?: [number, number];
  fitPanIndia?: boolean;
  typeFilter?: string;
  searchedLocation?: {
    name: string;
    address?: string;
    lat: number;
    lng: number;
  } | null;
  onReportClick?: (report: IncidentReport) => void;
  onResetPanIndia?: () => void;
}

export const DisasterLeafletMap: React.FC<DisasterLeafletMapProps> = ({
  disasters = [],
  safeZones = [],
  resources = [],
  reports = [],
  userLat,
  userLng,
  height = '600px',
  zoom = 5,
  center: controlledCenter,
  initialCenter = [22.3511, 78.6677], // Geographic center of India
  fitPanIndia = false,
  typeFilter = 'ALL',
  searchedLocation,
  onReportClick,
  onResetPanIndia,
}) => {
  const [showDisasters, setShowDisasters] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(false);

  // Filter disasters by selected type if specified
  const filteredDisasters = disasters.filter((d) => {
    if (!typeFilter || typeFilter === 'ALL') return true;
    return d.type?.toUpperCase() === typeFilter.toUpperCase();
  });

  const activeCenter: [number, number] = controlledCenter || initialCenter;
  const activeZoom: number = zoom ?? 5;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-hairline shadow-card" style={{ height }}>
      {/* Map Interactive Layer Toggle HUD */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] flex flex-col items-end">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={() => setLayersExpanded(!layersExpanded)}
          className="sm:hidden flex items-center space-x-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-hairline rounded-xl shadow-elevated text-xs font-semibold text-ink"
        >
          <span>GIS Layers</span>
          <span className="w-2 h-2 rounded-full bg-coral" />
        </button>

        {/* Layer Checkboxes */}
        <div
          className={`${
            layersExpanded ? 'flex' : 'hidden'
          } sm:flex bg-white/95 backdrop-blur-md border border-hairline p-3 sm:p-3.5 rounded-xl shadow-elevated flex-col space-y-2 text-xs mt-1.5 sm:mt-0 max-w-[calc(100vw-2rem)]`}
        >
          <div className="flex items-center justify-between pb-1 border-b border-hairline/60 gap-4">
            <span className="font-semibold text-ink tracking-wider uppercase text-[11px]">Active GIS Layers</span>
            <span className="text-[10px] font-mono text-ink-muted">Pan-India</span>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer text-ink-body hover:text-ink">
            <input
              type="checkbox"
              checked={showDisasters}
              onChange={(e) => setShowDisasters(e.target.checked)}
              className="rounded border-hairline text-coral focus:ring-0"
            />
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#C64545]" />
              Disaster Epicenters & Radius ({disasters.length})
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

          {onResetPanIndia && (
            <div className="pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={onResetPanIndia}
                className="w-full py-1 px-2 bg-canvas-subtle hover:bg-coral-subtle/80 hover:text-coral text-ink text-[11px] font-semibold rounded-lg border border-hairline transition flex items-center justify-center gap-1"
              >
                <span>🇮🇳</span> Reset to Pan-India View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Leaflet Container */}
      <MapContainer
        center={activeCenter}
        zoom={activeZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <ChangeView center={activeCenter} zoom={activeZoom} fitPanIndia={fitPanIndia} />

        {/* Standard OpenStreetMap Cartography */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Geolocation Marker */}
        {userLat && userLng && (
          <Marker position={[Number(userLat), Number(userLng)]} icon={userIcon}>
            <Popup className="custom-popup">
              <div className="p-1">
                <p className="font-semibold text-ink text-xs">Your Current Location</p>
                <p className="text-[10px] text-ink-muted font-mono mt-0.5">
                  {Number(userLat).toFixed(4)}°N, {Number(userLng).toFixed(4)}°E
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Searched Location Marker */}
        {searchedLocation &&
          !isNaN(Number(searchedLocation.lat)) &&
          !isNaN(Number(searchedLocation.lng)) && (
            <React.Fragment>
              <Circle
                center={[Number(searchedLocation.lat), Number(searchedLocation.lng)]}
                radius={800}
                pathOptions={{
                  color: '#E11D48',
                  fillColor: '#E11D48',
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              />
              <Marker
                position={[Number(searchedLocation.lat), Number(searchedLocation.lng)]}
                icon={createCustomIcon('#E11D48', '🎯')}
              >
                <Popup className="custom-popup" autoPan>
                  <div className="p-2 space-y-1 max-w-xs">
                    <span className="text-[10px] font-mono uppercase font-bold text-coral bg-coral-subtle px-1.5 py-0.5 rounded">
                      Searched Location
                    </span>
                    <h4 className="font-bold text-ink text-sm leading-tight">
                      {searchedLocation.name}
                    </h4>
                    {searchedLocation.address && (
                      <p className="text-xs text-ink-muted leading-snug">
                        {searchedLocation.address}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-ink-subtle pt-1 border-t border-hairline">
                      {Number(searchedLocation.lat).toFixed(4)}°N, {Number(searchedLocation.lng).toFixed(4)}°E
                    </p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          )}

        {/* 1. Active Disasters and Circular Impact Buffers */}
        {showDisasters &&
          filteredDisasters
            .filter((d) => !isNaN(Number(d.latitude)) && !isNaN(Number(d.longitude)))
            .map((d) => {
              const lat = Number(d.latitude);
              const lng = Number(d.longitude);
              const rad = Number(d.radiusKm || 15) * 1000;
              return (
                <React.Fragment key={d.id}>
                  <Circle
                    center={[lat, lng]}
                    radius={rad}
                    pathOptions={{
                      color: d.severity === 'CRITICAL' ? '#CC785C' : '#D97706',
                      fillColor: d.severity === 'CRITICAL' ? '#CC785C' : '#D97706',
                      fillOpacity: 0.12,
                      weight: 1.5,
                      dashArray: '4, 4',
                    }}
                  />
                  <Marker position={[lat, lng]} icon={createCustomIcon('#C64545', '⚠️')}>
                    <Popup className="custom-popup">
                      <div className="p-2 space-y-1.5 max-w-xs">
                        <div className="flex items-center justify-between gap-1">
                          <Badge severity={d.severity} />
                          <span className="text-[10px] font-mono text-ink-muted uppercase">{d.type}</span>
                        </div>
                        <h4 className="font-semibold text-ink text-sm leading-tight">{d.title}</h4>
                        <p className="text-[11px] text-ink-muted flex items-center gap-1 font-medium">
                          <span>📍</span> {d.locationName}
                        </p>
                        <p className="text-xs text-ink-body line-clamp-3">{d.description}</p>
                        <div className="text-[11px] text-ink-muted pt-1 border-t border-hairline flex items-center justify-between">
                          <span>
                            <strong>Radius:</strong> {d.radiusKm} km
                          </span>
                          <span>
                            <strong>Affected:</strong> ~{(d.affectedPopulationEst || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

        {/* 2. Safe Zones */}
        {showSafeZones &&
          safeZones
            .filter((sz) => !isNaN(Number(sz.latitude)) && !isNaN(Number(sz.longitude)))
            .map((sz) => {
              const lat = Number(sz.latitude);
              const lng = Number(sz.longitude);
              return (
                <Marker key={sz.id} position={[lat, lng]} icon={createCustomIcon('#166534', '🛡️')}>
                  <Popup className="custom-popup">
                    <div className="p-2 space-y-1.5 max-w-xs">
                      <div className="flex items-center justify-between gap-1">
                        <Badge status={sz.status} />
                        <span className="text-[10px] font-mono text-ink-muted uppercase">{sz.type}</span>
                      </div>
                      <h4 className="font-semibold text-ink text-sm leading-tight">{sz.name}</h4>
                      <p className="text-[11px] text-ink-muted flex items-center gap-1 font-medium">
                        <span>📍</span> {sz.locationName}
                      </p>
                      <div className="text-xs text-ink-body pt-1 space-y-0.5 border-t border-hairline">
                        <p className="flex justify-between">
                          <strong>Capacity:</strong>
                          <span className="font-semibold text-emerald-700">
                            {sz.capacityOccupied} / {sz.capacityTotal}
                          </span>
                        </p>
                        {sz.elevationMeters && (
                          <p className="flex justify-between text-ink-muted">
                            <span>Elevation:</span>
                            <span>{sz.elevationMeters}m MSL</span>
                          </p>
                        )}
                        {sz.contactPerson && (
                          <p className="text-[11px] text-ink-muted truncate">
                            <strong>Nodal:</strong> {sz.contactPerson}
                          </p>
                        )}
                        {sz.contactPhone && (
                          <p className="pt-0.5">
                            <a
                              href={`tel:${sz.contactPhone}`}
                              className="text-xs font-semibold text-coral hover:underline"
                            >
                              📞 {sz.contactPhone}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* 3. Emergency Resources / Hospitals */}
        {showResources &&
          resources
            .filter((resItem) => !isNaN(Number(resItem.latitude)) && !isNaN(Number(resItem.longitude)))
            .map((resItem) => {
              const lat = Number(resItem.latitude);
              const lng = Number(resItem.longitude);
              return (
                <Marker key={resItem.id} position={[lat, lng]} icon={createCustomIcon('#1E40AF', '🏥')}>
                  <Popup className="custom-popup">
                    <div className="p-2 space-y-1.5 max-w-xs">
                      <div className="flex items-center justify-between gap-1">
                        <Badge status={resItem.status} />
                        <span className="text-[10px] font-mono text-ink-muted uppercase">
                          {resItem.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-ink text-sm leading-tight">{resItem.name}</h4>
                      <p className="text-[11px] text-ink-muted flex items-center gap-1 font-medium">
                        <span>📍</span> {resItem.locationName}
                      </p>
                      <p className="text-xs text-ink-body">{resItem.details}</p>
                      <p className="text-xs font-semibold text-[#1E40AF] pt-1 border-t border-hairline">
                        <a href={`tel:${resItem.contactNumber}`} className="hover:underline flex items-center gap-1">
                          <span>📞</span> {resItem.contactNumber}
                        </a>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* 4. Citizen Incident Reports */}
        {showReports &&
          reports
            .filter((rpt) => !isNaN(Number(rpt.latitude)) && !isNaN(Number(rpt.longitude)))
            .map((rpt) => {
              const lat = Number(rpt.latitude);
              const lng = Number(rpt.longitude);
              return (
                <Marker
                  key={rpt.id}
                  position={[lat, lng]}
                  icon={createCustomIcon(
                    rpt.status === 'VERIFIED' ? '#D97706' : '#B45309',
                    '📍'
                  )}
                  eventHandlers={{
                    click: () => onReportClick && onReportClick(rpt),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 space-y-1.5 max-w-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-ink-muted font-bold">
                          {rpt.trackingCode}
                        </span>
                        <Badge status={rpt.status} />
                      </div>
                      <h4 className="font-semibold text-ink text-sm leading-tight">{rpt.title}</h4>
                      <p className="text-[11px] text-ink-muted flex items-center gap-1 font-medium">
                        <span>📍</span> {rpt.locationName}
                      </p>
                      <p className="text-xs text-ink-body line-clamp-3">{rpt.description}</p>
                      {rpt.imageUrl && (
                        <img
                          src={rpt.imageUrl}
                          alt="Incident proof"
                          className="w-full h-24 object-cover rounded-md mt-1 border border-hairline"
                        />
                      )}
                      <div className="text-[10px] text-ink-muted pt-1 border-t border-hairline flex items-center justify-between">
                        <span>Reporter: {rpt.citizenName || 'Verified Citizen'}</span>
                        <span className="font-semibold text-coral">{rpt.triagePriority} Priority</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
      </MapContainer>
    </div>
  );
};
