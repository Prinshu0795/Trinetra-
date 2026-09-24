// server/src/controllers/disaster.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';
import { calculateHaversineDistanceKm } from '../utils/gis.js';

const prisma = new PrismaClient();

export async function listDisasters(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, type, severity, lat, lng } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (type && typeof type === 'string' && type !== 'ALL') {
      where.type = type;
    }
    if (severity && typeof severity === 'string' && severity !== 'ALL') {
      where.severity = severity;
    }

    const disasters = await prisma.disaster.findMany({
      where,
      orderBy: [{ declaredAt: 'desc' }],
      include: {
        _count: {
          select: {
            alerts: true,
            incidentReports: true,
          },
        },
      },
    });

    let results = disasters.map((d) => ({
      ...d,
      alertCount: d._count.alerts,
      reportCount: d._count.incidentReports,
    }));

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        results = results.map((d) => ({
          ...d,
          distanceKm: calculateHaversineDistanceKm(userLat, userLng, d.latitude, d.longitude),
        }));
      }
    }

    return sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
}

export async function getDisasterById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const disaster = await prisma.disaster.findUnique({
      where: { id },
      include: {
        alerts: {
          where: { status: 'ACTIVE' },
          orderBy: { issuedAt: 'desc' },
        },
        incidentReports: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        riskAssessments: {
          take: 5,
          orderBy: { evaluatedAt: 'desc' },
        },
      },
    });

    if (!disaster) {
      throw new ApiError('Disaster not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, disaster);
  } catch (error) {
    next(error);
  }
}

export async function createDisaster(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      title,
      type,
      severity,
      status,
      locationName,
      latitude,
      longitude,
      radiusKm,
      description,
      affectedPopulationEst,
    } = req.body;

    const disaster = await prisma.disaster.create({
      data: {
        title,
        type,
        severity,
        status: status || 'ACTIVE',
        locationName,
        latitude,
        longitude,
        radiusKm: radiusKm || 10.0,
        description,
        affectedPopulationEst: affectedPopulationEst || 0,
        source: req.user?.department || 'Authorized Incident Commander',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DISASTER_CREATED',
        entityType: 'Disaster',
        entityId: disaster.id,
        details: JSON.stringify({ title, type, severity, locationName }),
      },
    });

    return sendSuccess(res, disaster, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateDisaster(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    const disaster = await prisma.disaster.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DISASTER_UPDATED',
        entityType: 'Disaster',
        entityId: disaster.id,
        details: JSON.stringify(updateData),
      },
    });

    return sendSuccess(res, disaster);
  } catch (error) {
    next(error);
  }
}
