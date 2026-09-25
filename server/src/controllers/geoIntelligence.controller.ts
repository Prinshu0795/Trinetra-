// server/src/controllers/geoIntelligence.controller.ts
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getWeatherData } from '../services/WeatherService.js';
import { calculateLocationRisk } from '../services/RiskEngine.js';
import {
  findNearbyResources,
  findNearbySafeZones,
  findNearbyIncidents,
  findNearbyAlerts,
  findNearbyDisasters,
  getAllActiveDisasters,
  getFloodBuffers,
} from '../services/GeoService.js';
import { ShelterDiscoveryService } from '../services/ShelterDiscoveryService.js';

// Pan-India fallback geocoding database for instant zero-latency offline matching
const PAN_INDIA_LOCATIONS = [
  { name: 'Guwahati, Assam', full_address: 'Guwahati, Kamrup Metropolitan, Assam, India', lat: 26.1445, lng: 91.7362 },
  { name: 'Delhi NCR', full_address: 'National Capital Territory of Delhi, India', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai, Maharashtra', full_address: 'Mumbai, Mumbai Suburban, Maharashtra, India', lat: 19.0760, lng: 72.8777 },
  { name: 'Chamoli, Uttarakhand', full_address: 'Chamoli Gopeshwar, Uttarakhand, India', lat: 30.5562, lng: 79.5670 },
  { name: 'Wayanad, Kerala', full_address: 'Kalpetta, Wayanad, Kerala, India', lat: 11.5534, lng: 76.1320 },
  { name: 'Bengaluru, Karnataka', full_address: 'Bengaluru Urban, Karnataka, India', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai, Tamil Nadu', full_address: 'Chennai District, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata, West Bengal', full_address: 'Kolkata, West Bengal, India', lat: 22.5726, lng: 88.3639 },
  { name: 'Patna, Bihar', full_address: 'Patna, Bihar, India', lat: 25.5941, lng: 85.1376 },
  { name: 'Joshimath, Uttarakhand', full_address: 'Joshimath, Chamoli, Uttarakhand, India', lat: 30.5574, lng: 79.5663 },
  { name: 'Bhubaneswar, Odisha', full_address: 'Bhubaneswar, Khordha, Odisha, India', lat: 20.2961, lng: 85.8245 },
  { name: 'Shimla, Himachal Pradesh', full_address: 'Shimla, Himachal Pradesh, India', lat: 31.1048, lng: 77.1734 },
  { name: 'Srinagar, Jammu & Kashmir', full_address: 'Srinagar, Jammu and Kashmir, India', lat: 34.0837, lng: 74.7973 },
  { name: 'Puri, Odisha', full_address: 'Puri Coastal Zone, Odisha, India', lat: 19.8135, lng: 85.8312 },
  { name: 'Silchar, Assam', full_address: 'Silchar, Cachar, Assam, India', lat: 24.8333, lng: 92.7789 },
];

export async function searchLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      throw new ApiError('Query parameter "q" is required', 400);
    }

    // 1. Try Mapbox Search Geocode v6 if token configured
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (token && token.startsWith('pk.eyJ')) {
      try {
        const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
          query
        )}&country=in&access_token=${token}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (response.ok) {
          const data = await response.json();
          if (data?.features?.length > 0) {
            return sendSuccess(res, data);
          }
        }
      } catch (err: any) {
        console.warn('[searchLocation] Mapbox geocode notice:', err.message);
      }
    }

    // 2. Real OpenStreetMap Nominatim Live Geocoding for India
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&countrycodes=in&limit=6&addressdetails=1`;
      const osmResponse = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'TRINETRA-Disaster-Platform/1.0 (Emergency Situational Awareness; contact@trinetra.gov.in)',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (osmResponse.ok) {
        const osmData = (await osmResponse.json()) as any[];
        if (Array.isArray(osmData) && osmData.length > 0) {
          const features = osmData.map((item) => ({
            properties: {
              name: item.name || item.display_name.split(',')[0].trim(),
              full_address: item.display_name,
              coordinates: {
                longitude: parseFloat(item.lon),
                latitude: parseFloat(item.lat),
              },
            },
          }));
          return sendSuccess(res, { features });
        }
      }
    } catch (err: any) {
      console.warn('[searchLocation] OSM Nominatim geocode notice:', err.message);
    }

    // 3. Resilient Fallback: Match against curated Pan-India location registry
    const qLower = query.toLowerCase();
    const matched = PAN_INDIA_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(qLower) || loc.full_address.toLowerCase().includes(qLower)
    );

    const fallbackFeatures = (matched.length > 0 ? matched : PAN_INDIA_LOCATIONS.slice(0, 3)).map((item) => ({
      properties: {
        name: item.name,
        full_address: item.full_address,
        coordinates: {
          longitude: item.lng,
          latitude: item.lat,
        },
      },
    }));

    return sendSuccess(res, { features: fallbackFeatures });
  } catch (error) {
    next(error);
  }
}

export async function getLocationIntelligence(req: Request, res: Response, next: NextFunction) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 25; // default 25km

    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError('Latitude and longitude are required', 400);
    }

    const [
      weather,
      resources,
      shelterResult,
      incidents,
      alerts,
      allFloodBuffers,
      nearbyDisasters,
      allActiveDisasters,
    ] = await Promise.all([
      getWeatherData(lat, lng),
      findNearbyResources(lat, lng, radius),
      ShelterDiscoveryService.getInstantShelters(lat, lng, radius),
      findNearbyIncidents(lat, lng, radius),
      findNearbyAlerts(lat, lng, radius),
      getFloodBuffers(),
      findNearbyDisasters(lat, lng, radius),
      getAllActiveDisasters(),
    ]);

    // Filter resources
    const medicalFacilities = resources.filter((r) => r.category === 'HOSPITAL' || r.category === 'AMBULANCE_BASE');
    const responseBases = resources.filter(
      (r) => r.category === 'NDRF_UNIT' || r.category === 'FIRE_STATION' || r.category === 'POLICE_STATION'
    );

    const risk = calculateLocationRisk(weather, incidents, alerts, allFloodBuffers);

    // If nearby active disasters exist, elevate risk calculation accordingly
    if (nearbyDisasters.length > 0 && !risk.factors.some((f) => f.includes('disaster epicenter'))) {
      const highestSeverity = nearbyDisasters.some((d) => d.severity === 'CRITICAL')
        ? 'CRITICAL'
        : nearbyDisasters.some((d) => d.severity === 'HIGH')
        ? 'HIGH'
        : 'MODERATE';

      risk.riskScore = Math.min(100, Math.max(risk.riskScore, highestSeverity === 'CRITICAL' ? 88 : 72));
      if (highestSeverity === 'CRITICAL' || risk.riskScore >= 75) {
        risk.riskLevel = 'HIGH';
      }
      risk.factors.unshift(
        `Within impact buffer of active disaster: ${nearbyDisasters[0].title} (${nearbyDisasters[0].type})`
      );
    }

    return sendSuccess(res, {
      location: { lat, lng, radius },
      risk,
      weather,
      floodBuffers: allFloodBuffers,
      nearbyDisasters,
      allActiveDisasters,
      safeCamps: shelterResult.shelters,
      shelterTelemetry: {
        verifiedCount: shelterResult.verifiedCount,
        osmCount: shelterResult.osmCount,
        cached: shelterResult.cached,
      },
      medicalFacilities,
      responseBases,
      citizenIncidents: incidents,
      alerts,
      sources: [
        { name: 'TRINETRA AI RISK ENGINE', type: 'PREDICTIVE HAZARD MODEL' },
        { name: 'Open-Meteo Sensor Network', type: 'LIVE METEOROLOGY' },
        { name: 'OpenStreetMap Overpass GIS', type: 'DYNAMIC SHELTER TELEMETRY' },
        { name: 'USGS, GDACS & NASA EONET', type: 'REALTIME DISASTER FEEDS' },
        { name: 'Verified NDRF & State Registry', type: 'CRITICAL INFRASTRUCTURE' },
        { name: 'Citizen Geotagged Eyewitness', type: 'GROUND TELEMETRY' },
      ],
    });
  } catch (error) {
    next(error);
  }
}

