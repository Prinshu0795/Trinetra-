// server/src/services/ShelterDiscoveryService.ts
import { findNearbySafeZones, calculateDistance } from './GeoService.js';

export interface InstantShelter {
  id: string;
  name: string;
  type: string;
  locationName: string;
  latitude: number;
  longitude: number;
  capacityTotal: number;
  capacityOccupied: number;
  occupancyPercentage: number;
  status: 'OPEN' | 'NEAR_CAPACITY' | 'FULL' | 'STANDBY' | 'CLOSED';
  amenities: string[];
  contactPerson?: string;
  contactPhone?: string;
  elevationMeters?: number;
  source: 'TRINETRA_VERIFIED' | 'OPENSTREETMAP';
  distanceKm: number;
  lastVerifiedAt?: string;
}

interface CacheEntry {
  data: InstantShelter[];
  timestamp: number;
}

// In-memory cache with bounded size (max 500 entries) to prevent memory leaks
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL
const MAX_CACHE_ENTRIES = 500;

function pruneCache() {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const keys = Array.from(cache.keys());
    for (let i = 0; i < 100; i++) {
      cache.delete(keys[i]);
    }
  }
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export class ShelterDiscoveryService {
  /**
   * Queries verified database safe zones and dynamically supplements with
   * OpenStreetMap emergency shelters / assembly points if local coverage is sparse
   * or when live discovery is explicitly requested.
   */
  static async getInstantShelters(
    lat: number,
    lng: number,
    radiusKm = 25,
    forceLive = false
  ): Promise<{
    shelters: InstantShelter[];
    verifiedCount: number;
    osmCount: number;
    cached: boolean;
    center: { lat: number; lng: number; radiusKm: number };
  }> {
    // 1. Sanitize & clamp input parameters
    const safeLat = Math.max(-90, Math.min(90, Number(lat)));
    const safeLng = Math.max(-180, Math.min(180, Number(lng)));
    const safeRadiusKm = Math.max(1, Math.min(100, Number(radiusKm) || 25));

    const cacheKey = `${safeLat.toFixed(2)}_${safeLng.toFixed(2)}_${safeRadiusKm}_${forceLive}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const verifiedCount = cached.data.filter((s) => s.source === 'TRINETRA_VERIFIED').length;
      return {
        shelters: cached.data,
        verifiedCount,
        osmCount: cached.data.length - verifiedCount,
        cached: true,
        center: { lat: safeLat, lng: safeLng, radiusKm: safeRadiusKm },
      };
    }

    const shelters: InstantShelter[] = [];

    // 2. Query Verified Database Safe Zones
    try {
      const localZones = await findNearbySafeZones(safeLat, safeLng, safeRadiusKm);
      for (const sz of localZones) {
        let amenitiesList: string[] = [];
        try {
          amenitiesList = JSON.parse(sz.amenities);
          if (!Array.isArray(amenitiesList)) amenitiesList = ['Emergency Shelter'];
        } catch {
          amenitiesList = ['Emergency Shelter', 'First Aid Station'];
        }

        const distance = calculateDistance(safeLat, safeLng, sz.latitude, sz.longitude);
        const occupancyPercentage =
          sz.capacityTotal > 0 ? Math.round((sz.capacityOccupied / sz.capacityTotal) * 100) : 0;

        shelters.push({
          id: sz.id,
          name: sz.name,
          type: sz.type,
          locationName: sz.locationName,
          latitude: sz.latitude,
          longitude: sz.longitude,
          capacityTotal: sz.capacityTotal,
          capacityOccupied: sz.capacityOccupied,
          occupancyPercentage,
          status: sz.status as any,
          amenities: amenitiesList,
          contactPerson: sz.contactPerson || undefined,
          contactPhone: sz.contactPhone || undefined,
          elevationMeters: sz.elevationMeters || undefined,
          source: 'TRINETRA_VERIFIED',
          distanceKm: Number(distance.toFixed(1)),
          lastVerifiedAt: sz.lastVerifiedAt?.toISOString(),
        });
      }
    } catch (err: any) {
      console.error('[ShelterDiscoveryService] Local safe zones error:', err.message);
    }

    const verifiedCount = shelters.length;

    // 3. Dynamic OpenStreetMap Overpass API discovery (if verified < 3 or forceLive)
    if (verifiedCount < 3 || forceLive) {
      const queryRadiusMeters = Math.min(Math.round(safeRadiusKm * 1000), 30000); // cap to 30km for Overpass speed
      const query = `
        [out:json][timeout:8];
        (
          node["emergency"="assembly_point"](around:${queryRadiusMeters},${safeLat},${safeLng});
          node["social_facility"="shelter"](around:${queryRadiusMeters},${safeLat},${safeLng});
          node["amenity"="community_centre"](around:${queryRadiusMeters},${safeLat},${safeLng});
          way["emergency"="assembly_point"](around:${queryRadiusMeters},${safeLat},${safeLng});
          way["social_facility"="shelter"](around:${queryRadiusMeters},${safeLat},${safeLng});
          way["amenity"="community_centre"](around:${queryRadiusMeters},${safeLat},${safeLng});
        );
        out center 25;
      `;

      let osmSuccess = false;

      // Try primary, then secondary mirror if needed
      for (const endpoint of OVERPASS_ENDPOINTS) {
        if (osmSuccess) break;
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'TrinetraDisasterManagement/1.0',
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: AbortSignal.timeout(3000), // 3s timeout
          });

          if (!response.ok) {
            continue;
          }

          const osmData = (await response.json()) as any;
          const elements = osmData?.elements || [];

          for (const el of elements) {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            if (typeof elLat !== 'number' || typeof elLng !== 'number') continue;
            if (elLat < -90 || elLat > 90 || elLng < -180 || elLng > 180) continue;

            const dist = calculateDistance(safeLat, safeLng, elLat, elLng);
            if (dist > safeRadiusKm) continue;

            // Deduplicate: Check if near (< 150m) an already-added shelter (verified or previous OSM)
            const isDuplicate = shelters.some(
              (s) => calculateDistance(s.latitude, s.longitude, elLat, elLng) < 0.15
            );
            if (isDuplicate) continue;

            const tags = el.tags || {};
            const isAssembly = tags.emergency === 'assembly_point';
            const isShelter = tags.social_facility === 'shelter' || tags.amenity === 'shelter';

            let type = 'Community Relief Centre';
            if (isAssembly) type = 'Emergency Assembly Point';
            else if (isShelter) type = 'Emergency Disaster Shelter';

            const defaultName = isAssembly
              ? 'Public Evacuation Assembly Point'
              : 'Community Disaster Relief Centre';
            const rawName = tags.name || tags.description || tags.operator || defaultName;
            const cleanName = String(rawName).trim().slice(0, 80);

            const amenities: string[] = ['Open Ground', 'Public Gathering Area'];
            if (tags.drinking_water === 'yes') amenities.push('Drinking Water');
            if (tags.wheelchair === 'yes') amenities.push('Wheelchair Accessible');
            if (tags.phone) amenities.push(`Contact: ${tags.phone}`);
            if (tags.covered === 'yes') amenities.push('Covered Shelter');

            shelters.push({
              id: `OSM-${el.type || 'node'}-${el.id}`,
              name: cleanName,
              type,
              locationName:
                tags['addr:street'] || tags['addr:city'] || `${dist.toFixed(1)} km from search center`,
              latitude: elLat,
              longitude: elLng,
              capacityTotal: 150,
              capacityOccupied: 0,
              occupancyPercentage: 0,
              status: 'OPEN',
              amenities,
              source: 'OPENSTREETMAP',
              distanceKm: Number(dist.toFixed(1)),
              lastVerifiedAt: new Date().toISOString(),
            });
          }

          osmSuccess = true;
        } catch (err: any) {
          console.warn(`[ShelterDiscoveryService] Endpoint ${endpoint} notice:`, err.message);
        }
      }
    }

    // 4. Sort consolidated list strictly by distance
    shelters.sort((a, b) => a.distanceKm - b.distanceKm);

    // 5. Store in bounded cache
    pruneCache();
    cache.set(cacheKey, {
      data: shelters,
      timestamp: Date.now(),
    });

    const osmCount = shelters.length - verifiedCount;

    return {
      shelters,
      verifiedCount,
      osmCount,
      cached: false,
      center: { lat: safeLat, lng: safeLng, radiusKm: safeRadiusKm },
    };
  }

  /**
   * Clear cache for testing or manual flush
   */
  static clearCache() {
    cache.clear();
  }
}
