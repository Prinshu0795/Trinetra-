// server/src/controllers/resource.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';
import { calculateHaversineDistanceKm } from '../utils/gis.js';

const prisma = new PrismaClient();

// ─── SAFE ZONES ───
export async function listSafeZones(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, lat, lng, radiusKm } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const safeZones = await prisma.safeZone.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    let results = safeZones.map((sz) => ({
      ...sz,
      occupancyPercentage:
        sz.capacityTotal > 0 ? Math.round((sz.capacityOccupied / sz.capacityTotal) * 100) : 0,
    }));

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const maxRadius = radiusKm ? parseFloat(radiusKm as string) : Infinity;

      if (!isNaN(userLat) && !isNaN(userLng)) {
        results = results
          .map((sz) => ({
            ...sz,
            distanceKm: calculateHaversineDistanceKm(userLat, userLng, sz.latitude, sz.longitude),
          }))
          .filter((sz) => (sz.distanceKm ?? Infinity) <= maxRadius)
          .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }
    }

    return sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
}

export async function createSafeZone(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const safeZone = await prisma.safeZone.create({
      data: {
        ...data,
        source: req.user?.department || 'District Administration',
      },
    });
    return sendSuccess(res, safeZone, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateSafeZoneOccupancy(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { capacityOccupied, status } = req.body;

    const existing = await prisma.safeZone.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError('Safe zone not found', 404);
    }

    let computedStatus = status;
    if (!computedStatus) {
      const ratio = capacityOccupied / existing.capacityTotal;
      if (ratio >= 1.0) computedStatus = 'FULL';
      else if (ratio >= 0.85) computedStatus = 'NEAR_CAPACITY';
      else computedStatus = 'OPEN';
    }

    const updated = await prisma.safeZone.update({
      where: { id },
      data: {
        capacityOccupied,
        status: computedStatus,
        lastVerifiedAt: new Date(),
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

// ─── EMERGENCY RESOURCES ───
export async function listResources(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, status, lat, lng, radiusKm } = req.query;

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const resources = await prisma.emergencyResource.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    let results = [...resources];

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const maxRadius = radiusKm ? parseFloat(radiusKm as string) : Infinity;

      if (!isNaN(userLat) && !isNaN(userLng)) {
        results = results
          .map((resItem) => ({
            ...resItem,
            distanceKm: calculateHaversineDistanceKm(
              userLat,
              userLng,
              resItem.latitude,
              resItem.longitude
            ),
          }))
          .filter((resItem) => (resItem.distanceKm ?? Infinity) <= maxRadius)
          .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }
    }

    return sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
}

export async function createResource(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const resource = await prisma.emergencyResource.create({
      data: {
        ...data,
        source: req.user?.department || 'State Emergency Operations Center',
      },
    });
    return sendSuccess(res, resource, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateResource(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    const resource = await prisma.emergencyResource.update({
      where: { id },
      data: {
        ...updateData,
        lastVerifiedAt: new Date(),
      },
    });

    return sendSuccess(res, resource);
  } catch (error) {
    next(error);
  }
}
