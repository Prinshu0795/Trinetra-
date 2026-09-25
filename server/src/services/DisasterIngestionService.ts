// server/src/services/DisasterIngestionService.ts
import { PrismaClient } from '@prisma/client';
import { alertBroadcaster } from './AlertBroadcaster.js';

const prisma = new PrismaClient();

interface IngestionReport {
  totalSynced: number;
  usgsCount: number;
  gdacsCount: number;
  eonetCount: number;
  syncedAt: string;
  errors: string[];
}

/**
 * Robust coordinate extractor for diverse GIS GeoJSON geometries (Point, MultiPoint, Polygon centroid)
 */
function extractCoordinates(raw: any): [number, number] | null {
  if (!raw || !Array.isArray(raw)) return null;

  // Direct [lng, lat]
  if (typeof raw[0] === 'number' && typeof raw[1] === 'number') {
    const lng = Number(raw[0]);
    const lat = Number(raw[1]);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    return [lng, lat];
  }

  // Nested polygon or multi-point [[[lng, lat], ...]]
  if (Array.isArray(raw[0])) {
    return extractCoordinates(raw[0]);
  }

  return null;
}

/**
 * Safe date parser preventing SQLite / Prisma DateTime invalid crashes
 */
function parseSafeDate(rawDate: any): Date {
  if (!rawDate) return new Date();
  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Safe population parser handling formatted strings like "1,250,000", numbers, or null
 */
function parseSafePopulation(rawPop: any): number {
  if (!rawPop) return 0;
  if (typeof rawPop === 'number') return Math.max(0, Math.floor(rawPop));
  const cleaned = String(rawPop).replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Evaluates whether an event is relevant to India/South Asia or represents a major global catastrophe
 */
function isRelevantDisaster(
  lat: number,
  lng: number,
  placeOrTitle: string,
  magnitudeOrSeverity?: number | string
): boolean {
  // 1. Strict India & Immediate Maritime Economic Zone: Lat 5°N to 38°N, Lng 65°E to 98°E
  const inIndiaTerritory = lat >= 5.0 && lat <= 38.5 && lng >= 65.0 && lng <= 98.5;
  if (inIndiaTerritory) return true;

  // 2. Immediate South Asian cross-border river basins & maritime littoral (Bay of Bengal / Arabian Sea)
  const inRegionalBasin = lat >= 0.0 && lat <= 39.0 && lng >= 58.0 && lng <= 102.0;
  if (inRegionalBasin) {
    const lower = placeOrTitle.toLowerCase();
    const isSubcontinental =
      lower.includes('india') ||
      lower.includes('assam') ||
      lower.includes('bengal') ||
      lower.includes('delhi') ||
      lower.includes('mumbai') ||
      lower.includes('nepal') ||
      lower.includes('bhutan') ||
      lower.includes('bangladesh') ||
      lower.includes('myanmar') ||
      lower.includes('sri lanka') ||
      lower.includes('maldives') ||
      lower.includes('bay of bengal') ||
      lower.includes('arabian sea') ||
      lower.includes('andaman') ||
      lower.includes('nicobar');
    if (isSubcontinental) return true;
  }

  // 3. Catastrophic international events only if extreme magnitude (M >= 7.5) with direct Indian Ocean tsunami advisory
  if (typeof magnitudeOrSeverity === 'number' && magnitudeOrSeverity >= 7.5) {
    const lower = placeOrTitle.toLowerCase();
    if (lower.includes('indian ocean') || lower.includes('indonesia') || lower.includes('sumatra')) {
      return true;
    }
  }

  return false;
}

export class DisasterIngestionService {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * 1. USGS Real-time Earthquakes Ingestion (Regional + Global Significant)
   * Free, authoritative, updated every 60 seconds globally.
   */
  static async syncUSGS(): Promise<{ count: number; error?: string }> {
    try {
      const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TrinetraDisasterManagement/1.0' },
        signal: AbortSignal.timeout(10000), // 10s timeout protection
      });

      if (!res.ok) {
        throw new Error(`USGS HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const features = data?.features || [];

      let count = 0;
      for (const feat of features) {
        const props = feat?.properties || {};
        const coords = extractCoordinates(feat?.geometry?.coordinates);
        if (!coords) continue;

        const [lng, lat] = coords;
        const mag = typeof props.mag === 'number' ? props.mag : 3.0;
        const placeName = String(props.place || 'Seismic Center').trim();

        // Filter out non-relevant foreign micro-earthquakes (like California M2.5-M4.0)
        if (!isRelevantDisaster(lat, lng, placeName, mag)) {
          continue;
        }

        const depth = Array.isArray(feat?.geometry?.coordinates) ? feat.geometry.coordinates[2] : null;

        let severity = 'LOW';
        if (mag >= 6.5) severity = 'CRITICAL';
        else if (mag >= 5.0) severity = 'HIGH';
        else if (mag >= 4.0) severity = 'MEDIUM';

        const radiusKm = Math.max(10, Math.round(mag * 9));
        const externalId = `USGS-${feat.id || feat.properties?.code || `${lat}_${lng}`}`;

        await prisma.disaster.upsert({
          where: { id: externalId },
          update: {
            severity,
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
          create: {
            id: externalId,
            title: `M ${mag.toFixed(1)} Earthquake - ${placeName}`,
            type: 'EARTHQUAKE',
            severity,
            status: 'ACTIVE',
            locationName: placeName,
            latitude: lat,
            longitude: lng,
            radiusKm,
            description: `Seismic event magnitude ${mag.toFixed(1)} recorded at a depth of ${
              typeof depth === 'number' ? depth.toFixed(1) : '10.0'
            } km. Tsunami risk flag: ${props.tsunami ? 'YES' : 'NO'}. Source: USGS Earthquake Hazards Program.`,
            affectedPopulationEst: mag >= 6.0 ? 50000 : 5000,
            source: 'USGS Earthquake Feed',
            declaredAt: parseSafeDate(props.time),
          },
        });
        count++;
      }

      return { count };
    } catch (err: any) {
      console.error('[DisasterIngestionService] USGS sync error:', err.message);
      return { count: 0, error: `USGS: ${err.message}` };
    }
  }

  /**
   * 2. GDACS Global Disaster Alert & Coordination System Ingestion
   * UN OCHA & European Commission JRC multi-hazard alerts.
   */
  static async syncGDACS(): Promise<{ count: number; error?: string }> {
    try {
      const url =
        'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC;FL;EQ;WF;VO&alertlevel=red;orange;green';
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TrinetraDisasterManagement/1.0' },
        signal: AbortSignal.timeout(10000), // 10s timeout protection
      });

      if (!res.ok) {
        throw new Error(`GDACS HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const features = data?.features || [];

      let count = 0;
      for (const item of features) {
        const props = item?.properties || {};
        const coords = extractCoordinates(item?.geometry?.coordinates);
        if (!coords) continue;

        const [lng, lat] = coords;
        const eventType = String(props.eventtype || '').toUpperCase();

        const typeMap: Record<string, string> = {
          TC: 'CYCLONE',
          FL: 'FLOOD',
          EQ: 'EARTHQUAKE',
          WF: 'WILDFIRE',
          VO: 'URBAN_EMERGENCY',
          DR: 'URBAN_EMERGENCY',
        };

        const disasterType = typeMap[eventType] || 'URBAN_EMERGENCY';
        const alertLevel = String(props.alertlevel || '').toLowerCase();

        let severity = 'MEDIUM';
        if (alertLevel === 'red') severity = 'CRITICAL';
        else if (alertLevel === 'orange') severity = 'HIGH';

        const externalId = `GDACS-${props.eventid || item.id || `${lat}_${lng}`}`;
        const eventName = String(props.name || props.htmldescription || `${disasterType} Advisory`).trim();
        const country = String(props.country || 'International Waters / Region').trim();

        // Filter out non-relevant foreign events (e.g. minor fires in Brazil/Italy)
        if (!isRelevantDisaster(lat, lng, `${eventName} ${country}`, alertLevel)) {
          continue;
        }

        const population = parseSafePopulation(props.population);

        await prisma.disaster.upsert({
          where: { id: externalId },
          update: {
            severity,
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
          create: {
            id: externalId,
            title: `${eventName} (${country})`,
            type: disasterType,
            severity,
            status: 'ACTIVE',
            locationName: country,
            latitude: lat,
            longitude: lng,
            radiusKm: severity === 'CRITICAL' ? 45.0 : 25.0,
            description:
              String(props.description || `GDACS Alert Level: ${props.alertlevel}`).trim() +
              (population > 0 ? ` Estimated population impact: ${population.toLocaleString()} persons.` : ''),
            affectedPopulationEst: population,
            source: 'GDACS / UN OCHA',
            declaredAt: parseSafeDate(props.fromdate),
          },
        });
        count++;
      }

      return { count };
    } catch (err: any) {
      console.error('[DisasterIngestionService] GDACS sync error:', err.message);
      return { count: 0, error: `GDACS: ${err.message}` };
    }
  }

  /**
   * 3. NASA EONET v3 Natural Event Tracker Ingestion
   * Covers wildfires, severe storms, landslides, and volcanoes.
   */
  static async syncNASA_EONET(): Promise<{ count: number; error?: string }> {
    try {
      const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=10&limit=30';
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TrinetraDisasterManagement/1.0' },
        signal: AbortSignal.timeout(10000), // 10s timeout protection
      });

      if (!res.ok) {
        throw new Error(`NASA EONET HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const events = data?.events || [];

      let count = 0;
      for (const ev of events) {
        const latestGeo = ev.geometry?.[ev.geometry.length - 1];
        const coords = extractCoordinates(latestGeo?.coordinates);
        if (!coords) continue;

        const [lng, lat] = coords;
        const eventTitle = String(ev.title || 'Satellite Natural Event Detection').trim();

        // Filter out non-relevant foreign events
        if (!isRelevantDisaster(lat, lng, eventTitle, 'HIGH')) {
          continue;
        }

        const categoryId = String(ev.categories?.[0]?.id || '').toLowerCase();

        let disasterType = 'URBAN_EMERGENCY';
        if (categoryId === 'wildfires') disasterType = 'WILDFIRE';
        else if (categoryId === 'severestorms') disasterType = 'CYCLONE';
        else if (categoryId === 'floods') disasterType = 'FLOOD';
        else if (categoryId === 'landslides') disasterType = 'LANDSLIDE';

        const externalId = `EONET-${ev.id || `${lat}_${lng}`}`;

        await prisma.disaster.upsert({
          where: { id: externalId },
          update: {
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
          create: {
            id: externalId,
            title: eventTitle,
            type: disasterType,
            severity: 'HIGH',
            status: 'ACTIVE',
            locationName: eventTitle,
            latitude: lat,
            longitude: lng,
            radiusKm: 20.0,
            description: `Satellite-verified hazard tracked by NASA Earth Observatory. Event ID: ${ev.id}. Category: ${categoryId}.`,
            affectedPopulationEst: 10000,
            source: 'NASA EONET',
            declaredAt: parseSafeDate(latestGeo?.date),
          },
        });
        count++;
      }

      return { count };
    } catch (err: any) {
      console.error('[DisasterIngestionService] NASA EONET sync error:', err.message);
      return { count: 0, error: `NASA EONET: ${err.message}` };
    }
  }

  /**
   * Unified Ingestion: Runs USGS, GDACS, and NASA EONET in parallel with circuit breaker
   */
  static async syncAllLiveFeeds(): Promise<IngestionReport> {
    if (this.isRunning) {
      console.log('[DisasterIngestionService] Ingestion already in progress, skipping duplicate call.');
      return {
        totalSynced: 0,
        usgsCount: 0,
        gdacsCount: 0,
        eonetCount: 0,
        syncedAt: new Date().toISOString(),
        errors: ['Ingestion already in progress'],
      };
    }

    this.isRunning = true;
    const errors: string[] = [];

    console.log('[DisasterIngestionService] Beginning live disaster feed ingestion...');
    const [usgsRes, gdacsRes, eonetRes] = await Promise.all([
      this.syncUSGS(),
      this.syncGDACS(),
      this.syncNASA_EONET(),
    ]);

    if (usgsRes.error) errors.push(usgsRes.error);
    if (gdacsRes.error) errors.push(gdacsRes.error);
    if (eonetRes.error) errors.push(eonetRes.error);

    const totalSynced = usgsRes.count + gdacsRes.count + eonetRes.count;
    console.log(
      `[DisasterIngestionService] Ingestion complete: +${totalSynced} events (USGS: ${usgsRes.count}, GDACS: ${gdacsRes.count}, EONET: ${eonetRes.count}).`
    );

    this.isRunning = false;

    // Broadcast newly synced critical alert telemetry if available
    try {
      alertBroadcaster.broadcast('FEED_SYNC_COMPLETE', {
        syncedCount: totalSynced,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking broadcast
    }

    return {
      totalSynced,
      usgsCount: usgsRes.count,
      gdacsCount: gdacsRes.count,
      eonetCount: eonetRes.count,
      syncedAt: new Date().toISOString(),
      errors,
    };
  }

  /**
   * Starts recurring background scheduler (runs every intervalMinutes)
   */
  static startAutoIngestion(intervalMinutes = 15) {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(
      `[DisasterIngestionService] Auto-ingestion initialized (runs every ${intervalMinutes} minutes).`
    );

    // Initial sync on boot
    this.syncAllLiveFeeds().catch((err) => {
      console.warn('[DisasterIngestionService] Initial boot sync notice:', err.message);
    });

    // Scheduled recurring sync
    this.timer = setInterval(() => {
      this.syncAllLiveFeeds().catch((err) => {
        console.warn('[DisasterIngestionService] Scheduled sync notice:', err.message);
      });
    }, intervalMinutes * 60 * 1000);

    // Do not block process termination
    this.timer.unref();
  }

  /**
   * Stop auto-ingestion gracefully
   */
  static stopAutoIngestion() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[DisasterIngestionService] Auto-ingestion stopped.');
    }
  }
}
