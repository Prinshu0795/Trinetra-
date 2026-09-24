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

export async function searchLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    if (!query) {
      throw new ApiError('Query parameter "q" is required', 400);
    }

    const token = process.env.MAPBOX_ACCESS_TOKEN || 'pk.fake';
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
      query
    )}&country=in&access_token=${token}`;
    
    // In demo mode or if missing token, fallback to a mock response for Ayodhya/Lucknow.
    if (token === 'pk.fake') {
      const isAyodhya = query.toLowerCase().includes('ayodhya');
      return sendSuccess(res, {
        features: [
          {
            properties: {
              name: isAyodhya ? 'Ayodhya' : query,
              full_address: isAyodhya ? 'Ayodhya, Uttar Pradesh, India' : `${query}, India`,
              coordinates: {
                longitude: isAyodhya ? 82.2044 : 80.9462, // Default Lucknow if not Ayodhya
                latitude: isAyodhya ? 26.7997 : 26.8467,
              }
            }
          }
        ]
      });
    }

    const response = await fetch(url);
    const data = await response.json();
    return sendSuccess(res, data);
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

    const [weather, resources, safeZones, incidents, alerts, allFloodBuffers] = await Promise.all([
      getWeatherData(lat, lng),
      findNearbyResources(lat, lng, radius),
      findNearbySafeZones(lat, lng, radius),
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
      safeCamps: safeZones,
      medicalFacilities,
      responseBases,
      citizenIncidents: incidents,
      alerts,
      sources: [
        { name: 'TRINETRA RISK MODEL', type: 'TRINETRA MODEL' },
        { name: 'Open-Meteo', type: 'WEATHER MODEL' },
        { name: 'Citizen Report', type: 'COMMUNITY' },
        { name: 'TRINETRA DEMO DATA', type: 'DEMO DATA' },
      ],
    });
  } catch (error) {
    next(error);
  }
}
