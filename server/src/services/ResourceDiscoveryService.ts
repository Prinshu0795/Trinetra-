// server/src/services/ResourceDiscoveryService.ts
import { PrismaClient } from '@prisma/client';
import { calculateDistance } from './GeoService.js';

const prisma = new PrismaClient();

export interface DiscoveredResource {
  id: string;
  name: string;
  category: 'HOSPITAL' | 'FIRE_STATION' | 'NDRF_UNIT' | 'POLICE_STATION' | 'AMBULANCE_BASE' | 'RELIEF_CAMP' | 'SUPPLY_DEPOT';
  locationName: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  status: 'AVAILABLE' | 'ENGAGED' | 'STANDBY' | 'DEPLETED';
  details: string;
  supplies: string;
  source: string;
  distanceKm: number;
  lastVerifiedAt?: string;
}

interface CacheEntry {
  data: DiscoveredResource[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_CACHE_ENTRIES = 300;

function pruneCache() {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const keys = Array.from(cache.keys());
    for (let i = 0; i < 60; i++) {
      cache.delete(keys[i]);
    }
  }
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export class ResourceDiscoveryService {
  static async getResources(
    lat?: number,
    lng?: number,
    radiusKm = 35,
    forceLive = false,
    categoryFilter = 'ALL'
  ): Promise<DiscoveredResource[]> {
    // 1. Fetch verified resources from Database
    const dbResources = await prisma.emergencyResource.findMany({
      orderBy: { name: 'asc' },
    });

    // If coordinates are not provided, return database records
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      return dbResources.map((r) => ({
        ...r,
        category: r.category as DiscoveredResource['category'],
        status: r.status as DiscoveredResource['status'],
        supplies: r.supplies || '',
        distanceKm: 0,
        lastVerifiedAt: r.lastVerifiedAt?.toISOString(),
      }));
    }

    const safeLat = Math.max(-90, Math.min(90, Number(lat)));
    const safeLng = Math.max(-180, Math.min(180, Number(lng)));
    const safeRadiusKm = Math.max(1, Math.min(150, Number(radiusKm) || 35));

    // Calculate distance for all verified database resources
    const verifiedWithDist: DiscoveredResource[] = dbResources.map((r) => {
      const dist = calculateDistance(safeLat, safeLng, r.latitude, r.longitude);
      return {
        ...r,
        category: r.category as DiscoveredResource['category'],
        status: r.status as DiscoveredResource['status'],
        supplies: r.supplies || '',
        distanceKm: Number(dist.toFixed(1)),
        lastVerifiedAt: r.lastVerifiedAt?.toISOString(),
      };
    });

    // Count how many verified resources are in the immediate vicinity (within radius)
    const nearbyVerified = verifiedWithDist.filter((r) => r.distanceKm <= safeRadiusKm);

    // If verified resources exist nearby and live is not forced, return verified sorted
    if (nearbyVerified.length >= 2 && !forceLive) {
      const filtered = verifiedWithDist.filter(
        (r) => categoryFilter === 'ALL' || r.category === categoryFilter
      );
      filtered.sort((a, b) => a.distanceKm - b.distanceKm);
      return filtered;
    }

    // Check cache for dynamic discovery
    const cacheKey = `${safeLat.toFixed(2)}_${safeLng.toFixed(2)}_${safeRadiusKm}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      let combined = [...verifiedWithDist, ...cached.data];
      // Deduplicate by name/location
      const seen = new Set<string>();
      combined = combined.filter((item) => {
        const key = `${item.name.toLowerCase()}_${item.latitude.toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (categoryFilter !== 'ALL') {
        combined = combined.filter((r) => r.category === categoryFilter);
      }
      combined.sort((a, b) => a.distanceKm - b.distanceKm);
      return combined;
    }

    // 2. Dynamic Live Overpass Discovery (Hospitals, Fire Stations, Police/Emergency)
    const discovered: DiscoveredResource[] = [];
    const queryRadiusMeters = Math.min(Math.round(safeRadiusKm * 1000), 30000);

    const query = `
      [out:json][timeout:8];
      (
        node["amenity"="hospital"](around:${queryRadiusMeters},${safeLat},${safeLng});
        node["amenity"="fire_station"](around:${queryRadiusMeters},${safeLat},${safeLng});
        node["amenity"="police"](around:${queryRadiusMeters},${safeLat},${safeLng});
        node["emergency"="ambulance_station"](around:${queryRadiusMeters},${safeLat},${safeLng});
        way["amenity"="hospital"](around:${queryRadiusMeters},${safeLat},${safeLng});
        way["amenity"="fire_station"](around:${queryRadiusMeters},${safeLat},${safeLng});
        way["amenity"="police"](around:${queryRadiusMeters},${safeLat},${safeLng});
      );
      out center 30;
    `;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TrinetraDisasterManagement/1.0',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(7000),
        });

        if (!response.ok) continue;

        const osmData = (await response.json()) as any;
        const elements = osmData?.elements || [];

        for (const el of elements) {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (typeof elLat !== 'number' || typeof elLng !== 'number') continue;
          if (elLat < -90 || elLat > 90 || elLng < -180 || elLng > 180) continue;

          const dist = calculateDistance(safeLat, safeLng, elLat, elLng);
          if (dist > safeRadiusKm) continue;

          const tags = el.tags || {};
          const amenity = tags.amenity;
          const emergency = tags.emergency;

          let category: DiscoveredResource['category'] = 'HOSPITAL';
          let defaultName = 'Emergency Medical Center';
          let defaultDetails = 'Emergency Medical Services & Trauma Unit.';
          let defaultSupplies = { emergencyBeds: 40, ambulances: 3, oxygen: 'Available' };
          let defaultContact = '108 / 112';

          if (amenity === 'fire_station') {
            category = 'FIRE_STATION';
            defaultName = 'Fire & Rescue Station';
            defaultDetails = 'Rapid fire response, de-watering equipment, and water rescue squads.';
            defaultSupplies = { rescueTrucks: 3, highDischargePumps: 4, responseSquad: 'On Duty' } as any;
            defaultContact = '101 / 112';
          } else if (amenity === 'police') {
            category = 'NDRF_UNIT';
            defaultName = 'Police & Emergency Response Command';
            defaultDetails = 'Local public safety command post and emergency evacuation coordination.';
            defaultSupplies = { patrolVehicles: 6, quickResponseForce: 15 } as any;
            defaultContact = '112 / 100';
          } else if (emergency === 'ambulance_station') {
            category = 'HOSPITAL';
            defaultName = 'Ambulance Dispatch Base';
            defaultDetails = '24x7 Ambulance response station and paramedic dispatch base.';
            defaultSupplies = { ambulances: 6, paramedics: 10 } as any;
            defaultContact = '108 / 112';
          }

          const rawName = tags.name || tags['name:en'] || defaultName;
          const cleanName = String(rawName).trim().slice(0, 90);
          const locationName =
            tags['addr:street'] || tags['addr:suburb'] || tags['addr:city'] || `${dist.toFixed(1)} km from current location`;

          const phone = tags.phone || tags['contact:phone'] || defaultContact;

          // Avoid duplicates with verified database items
          const isNearVerified = verifiedWithDist.some(
            (v) => calculateDistance(v.latitude, v.longitude, elLat, elLng) < 0.2
          );
          if (isNearVerified) continue;

          discovered.push({
            id: `OSM-RES-${el.type || 'node'}-${el.id}`,
            name: cleanName,
            category,
            locationName,
            latitude: elLat,
            longitude: elLng,
            contactNumber: phone,
            status: 'AVAILABLE',
            details: defaultDetails,
            supplies: JSON.stringify(defaultSupplies),
            source: 'OPENSTREETMAP_LIVE',
            distanceKm: Number(dist.toFixed(1)),
            lastVerifiedAt: new Date().toISOString(),
          });
        }

        break; // Successfully queried endpoint
      } catch (err: any) {
        console.warn(`[ResourceDiscoveryService] Endpoint ${endpoint} notice:`, err.message);
      }
    }

    // Save discovered resources in cache
    if (discovered.length > 0) {
      pruneCache();
      cache.set(cacheKey, {
        data: discovered,
        timestamp: Date.now(),
      });
    }

    // Combine only verified database resources within radius + discovered local resources
    const localVerified = verifiedWithDist.filter((r) => r.distanceKm <= safeRadiusKm);
    let combined = [...localVerified, ...discovered];

    // If completely empty in local radius (e.g. offline/no data), fallback to all sorted
    if (combined.length === 0) {
      combined = [...verifiedWithDist];
    }

    if (categoryFilter !== 'ALL') {
      combined = combined.filter((r) => r.category === categoryFilter);
    }

    combined.sort((a, b) => a.distanceKm - b.distanceKm);
    return combined;
  }
}
