// client/src/pages/citizen/GeoIntelligencePage.tsx
import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertCircle, ShieldCheck, Activity, CloudRain, Droplets, Map as MapIcon, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import api from '../../lib/api';

function LocationUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export const GeoIntelligencePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoadingSearch(true);
    try {
      const res = await api.get(`/geo-intelligence/search?q=${encodeURIComponent(query)}`);
      setSuggestions(res.data.data.features || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoadingSearch(false);
  };

  const loadGeoData = async (lat: number, lng: number, name: string, address: string) => {
    setSelectedLocation({ name, address, lat, lng });
    setSuggestions([]);
    
    setLoadingData(true);
    try {
      const res = await api.get(`/geo-intelligence/location?lat=${lat}&lng=${lng}&radius=25`);
      setGeoData(res.data.data);
    } catch (error) {
      console.error('Failed to load geo intelligence:', error);
    }
    setLoadingData(false);
  };

  const handleSelectLocation = (feature: any) => {
    const lng = feature.geometry?.coordinates?.[0] || feature.properties.coordinates.longitude;
    const lat = feature.geometry?.coordinates?.[1] || feature.properties.coordinates.latitude;
    const name = feature.properties.name || feature.place_name || feature.text;
    const address = feature.properties.full_address || feature.place_name;
    
    setQuery(name || '');
    loadGeoData(lat, lng, name, address);
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          loadGeoData(lat, lng, 'Your Location', 'Current Device Location');
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas pb-12">
      {/* Header */}
      <div className="bg-white border-b border-hairline py-8 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-ink tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-coral" />
              TRINETRA GEO-INTELLIGENCE
            </h1>
            <p className="text-xs text-ink-muted mt-1 font-mono uppercase tracking-wider">
              Real-time geospatial visualization & risk assessment
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <div className="relative">
              <input
                type="text"
                placeholder="Search city, village, location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-3 text-sm text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
              />
              <Search className="w-5 h-5 text-ink-subtle absolute left-3 top-3" />
              {loadingSearch && <Loader2 className="w-4 h-4 text-coral animate-spin absolute right-3 top-3.5" />}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-hairline rounded-lg shadow-xl z-50 overflow-hidden">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(s)}
                    className="w-full text-left px-4 py-3 hover:bg-canvas-subtle border-b border-hairline last:border-0 flex items-start gap-3 transition"
                  >
                    <MapPin className="w-4 h-4 text-ink-subtle mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{s.properties.name || s.place_name || s.text}</p>
                      <p className="text-xs text-ink-muted line-clamp-1">{s.properties.full_address || s.place_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {!selectedLocation && !loadingData && (
          <div className="bg-white border border-hairline rounded-2xl p-12 text-center text-ink-muted shadow-sm">
            <MapIcon className="w-12 h-12 mx-auto mb-4 text-ink-subtle opacity-50" />
            <h3 className="text-lg font-semibold text-ink mb-2">Search for a location</h3>
            <p className="text-sm">Enter any Indian city, village, or address to generate a localized risk assessment.</p>
          </div>
        )}

        {loadingData && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-coral animate-spin mb-4" />
            <p className="text-sm font-mono text-ink-muted animate-pulse">Aggregating live geospatial intelligence...</p>
          </div>
        )}

        {geoData && selectedLocation && !loadingData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Risk Summary */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-hairline rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${geoData.risk.riskLevel === 'HIGH' || geoData.risk.riskLevel === 'CRITICAL' ? 'bg-[#9E2A2B]' : 'bg-[#E59500]'}`} />
                <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-ink-muted mb-4">Location Assessment</h2>
                <div className="mb-6">
                  <p className="text-xl font-bold text-ink font-serif leading-tight">{selectedLocation.name}</p>
                  <p className="text-sm text-ink-subtle">{selectedLocation.address}</p>
                </div>
                
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <p className="text-5xl font-black text-ink font-mono">{Math.round(geoData.risk.riskScore)}</p>
                    <p className="text-xs text-ink-muted uppercase font-semibold">/ 100 Overall Risk</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded text-sm font-bold uppercase tracking-wider ${geoData.risk.riskLevel === 'HIGH' || geoData.risk.riskLevel === 'CRITICAL' ? 'bg-[#FDF2F2] text-[#9E2A2B]' : 'bg-[#FFFBEB] text-[#92400E]'}`}>
                    {geoData.risk.riskLevel}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-hairline">
                  <p className="text-xs font-semibold text-ink mb-3 uppercase tracking-wider">Contributing Factors:</p>
                  {geoData.risk.factors.length > 0 ? geoData.risk.factors.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-ink-body">
                      <AlertCircle className="w-4 h-4 text-[#C64545] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  )) : (
                    <div className="flex items-center gap-2 text-sm text-[#166534]">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                      <span>No immediate severe risk factors detected.</span>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-[10px] text-ink-subtle font-mono flex items-center justify-between">
                  <span>TRINETRA RISK MODEL</span>
                  <span className="bg-canvas-subtle px-1.5 rounded">OFFICIAL</span>
                </div>
              </div>

              {/* Weather Data */}
              {geoData.weather && (
                <div className="bg-white border border-hairline rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-ink-muted mb-4">Live Weather conditions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-ink">{geoData.weather.temperature}°C</p>
                      <p className="text-[10px] text-ink-muted uppercase font-semibold tracking-wider">Temperature</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">{geoData.weather.precipitationProbability}%</p>
                      <p className="text-[10px] text-ink-muted uppercase font-semibold tracking-wider">Rain Probability</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between text-[10px] text-ink-subtle font-mono">
                    <span className="flex items-center gap-1"><CloudRain className="w-3 h-3" /> Open-Meteo Model</span>
                    <span className="bg-canvas-subtle px-1.5 rounded">WEATHER MODEL</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Map and Datasets */}
            <div className="lg:col-span-2 space-y-6">
              {/* GIS Map */}
              <div className="bg-white border border-hairline rounded-xl shadow-sm overflow-hidden h-[450px] relative z-0">
                <MapContainer 
                  center={[selectedLocation.lat, selectedLocation.lng]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationUpdater center={[selectedLocation.lat, selectedLocation.lng]} />
                  
                  {/* Selected Location Pin */}
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                    <Popup>
                      <strong>{selectedLocation.name}</strong><br/>
                      Selected Target Location
                    </Popup>
                  </Marker>

                  {/* Render Resources, Safe Zones, Incidents as Circles for Demo */}
                  {geoData.safeCamps.map((camp: any) => (
                    <Circle key={camp.id} center={[camp.latitude, camp.longitude]} pathOptions={{ color: 'blue', fillColor: 'blue' }} radius={200}>
                      <Popup>🏕 <strong>{camp.name}</strong> (Verified Safe Camp)</Popup>
                    </Circle>
                  ))}
                  {geoData.medicalFacilities.map((med: any) => (
                    <Circle key={med.id} center={[med.latitude, med.longitude]} pathOptions={{ color: 'green', fillColor: 'green' }} radius={200}>
                      <Popup>🏥 <strong>{med.name}</strong> (Medical)</Popup>
                    </Circle>
                  ))}
                  {geoData.responseBases.map((base: any) => (
                    <Circle key={base.id} center={[base.latitude, base.longitude]} pathOptions={{ color: 'purple', fillColor: 'purple' }} radius={200}>
                      <Popup>🚨 <strong>{base.name}</strong> (Response Base)</Popup>
                    </Circle>
                  ))}
                  {geoData.citizenIncidents.map((inc: any) => (
                    <Circle key={inc.id} center={[inc.latitude, inc.longitude]} pathOptions={{ color: 'yellow', fillColor: 'yellow' }} radius={200}>
                      <Popup>📍 <strong>Incident:</strong> {inc.disasterType}</Popup>
                    </Circle>
                  ))}
                </MapContainer>
              </div>

              {/* Data Sources Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-hairline rounded-lg p-4 shadow-sm text-center">
                  <p className="text-xl font-bold text-ink">{geoData.safeCamps.length}</p>
                  <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mt-1">Safe Camps</p>
                </div>
                <div className="bg-white border border-hairline rounded-lg p-4 shadow-sm text-center">
                  <p className="text-xl font-bold text-ink">{geoData.medicalFacilities.length}</p>
                  <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mt-1">Medical</p>
                </div>
                <div className="bg-white border border-hairline rounded-lg p-4 shadow-sm text-center">
                  <p className="text-xl font-bold text-ink">{geoData.responseBases.length}</p>
                  <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mt-1">NDRF / Bases</p>
                </div>
                <div className="bg-white border border-hairline rounded-lg p-4 shadow-sm text-center">
                  <p className="text-xl font-bold text-ink">{geoData.citizenIncidents.length}</p>
                  <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mt-1">Citizen Reports</p>
                </div>
              </div>

              {/* Verified Sources Legend */}
              <div className="flex flex-wrap gap-2 pt-4">
                {geoData.sources.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-white border border-hairline rounded text-[10px] font-mono shadow-sm">
                    <span className="font-bold text-ink-body">{s.name}</span>
                    <span className="bg-canvas-subtle px-1.5 py-0.5 rounded text-ink-subtle">{s.type}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
