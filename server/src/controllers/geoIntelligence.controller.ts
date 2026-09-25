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
  getFloodBuffers,
} from '../services/GeoService.js';
import { ShelterDiscoveryService } from '../services/ShelterDiscoveryService.js';

export async function searchLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    if (!query) {
      throw new ApiError('Query parameter "q" is required', 400);
    }

    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (token && token.startsWith('pk.eyJ')) {
      const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
        query
      )}&country=in&access_token=${token}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return sendSuccess(res, data);
      }
    }

    // Real OpenStreetMap Nominatim Live Geocoding for India (Live public GIS, no mock data)
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&countrycodes=in&limit=5&addressdetails=1`;
    const osmResponse = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'TRINETRA-Disaster-Platform/1.0 (Emergency Situational Awareness; contact@trinetra.gov.in)',
      },
    });

    if (!osmResponse.ok) {
      throw new ApiError('Geocoding service currently unavailable', 503);
    }

    const osmData = (await osmResponse.json()) as any[];
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

    const [weather, resources, shelterResult, incidents, alerts, allFloodBuffers] = await Promise.all([
      getWeatherData(lat, lng),
      findNearbyResources(lat, lng, radius),
      ShelterDiscoveryService.getInstantShelters(lat, lng, radius),
      findNearbyIncidents(lat, lng, radius),
      findNearbyAlerts(lat, lng, radius),
      getFloodBuffers(),
    ]);

    // Filter resources
    const medicalFacilities = resources.filter((r) => r.category === 'HOSPITAL' || r.category === 'AMBULANCE_BASE');
    const responseBases = resources.filter(
      (r) => r.category === 'NDRF_UNIT' || r.category === 'FIRE_STATION' || r.category === 'POLICE_STATION'
    );

    const risk = calculateLocationRisk(weather, incidents, alerts, allFloodBuffers);

    return sendSuccess(res, {
      location: { lat, lng, radius },
      risk,
      weather,
      floodBuffers: allFloodBuffers,
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
        { name: 'TRINETRA RISK MODEL', type: 'TRINETRA MODEL' },
        { name: 'Open-Meteo', type: 'WEATHER MODEL' },
        { name: 'OpenStreetMap Overpass', type: 'DYNAMIC SHELTER GIS' },
        { name: 'USGS & GDACS', type: 'REALTIME DISASTER FEEDS' },
        { name: 'Citizen Eyewitness', type: 'COMMUNITY REPORTS' },
        { name: 'TRINETRA DATABASE', type: 'VERIFIED REGISTRY' },
      ],
    });
  } catch (error) {
    next(error);
  }
}
