// server/src/services/GeoService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Haversine distance in km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bounding box approximation (1 deg lat ~ 111km, 1 deg lng ~ 111km * cos(lat))
export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos(lat * (Math.PI / 180)));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

export async function findNearbyResources(lat: number, lng: number, radiusKm: number) {
  const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);

  const candidates = await prisma.emergencyResource.findMany({
    where: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
    },
  });

  return candidates.filter((c) => calculateDistance(lat, lng, c.latitude, c.longitude) <= radiusKm);
}

export async function findNearbySafeZones(lat: number, lng: number, radiusKm: number) {
  const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);

  const candidates = await prisma.safeZone.findMany({
    where: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
    },
  });

  return candidates.filter((c) => calculateDistance(lat, lng, c.latitude, c.longitude) <= radiusKm);
}

export async function findNearbyIncidents(lat: number, lng: number, radiusKm: number) {
  const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);

  const candidates = await prisma.incidentReport.findMany({
    where: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
    },
  });

  return candidates.filter((c) => calculateDistance(lat, lng, c.latitude, c.longitude) <= radiusKm);
}

export async function findNearbyAlerts(lat: number, lng: number, radiusKm: number) {
  const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, Math.max(radiusKm, 50));

  const candidates = await prisma.alert.findMany({
    where: {
      targetLatitude: { gte: minLat, lte: maxLat },
      targetLongitude: { gte: minLng, lte: maxLng },
      status: 'ACTIVE',
    },
  });

  return candidates.filter(
    (c) => calculateDistance(lat, lng, c.targetLatitude, c.targetLongitude) <= Math.max(radiusKm, c.targetRadiusKm)
  );
}

export async function findNearbyDisasters(lat: number, lng: number, radiusKm: number) {
  const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, Math.max(radiusKm, 100));

  const candidates = await prisma.disaster.findMany({
    where: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
      status: 'ACTIVE',
    },
  });

  return candidates.filter((c) => calculateDistance(lat, lng, c.latitude, c.longitude) <= Math.max(radiusKm, c.radiusKm));
}

export async function getAllActiveDisasters() {
  return prisma.disaster.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { declaredAt: 'desc' },
  });
}

export async function getFloodBuffers() {
  return prisma.floodBuffer.findMany();
}

