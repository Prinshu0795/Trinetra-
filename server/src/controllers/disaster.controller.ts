// server/src/controllers/disaster.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';
import { calculateHaversineDistanceKm } from '../utils/gis.js';
import { DisasterIngestionService } from '../services/DisasterIngestionService.js';

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

    const userLat = lat ? parseFloat(lat as string) : null;
    const userLng = lng ? parseFloat(lng as string) : null;

    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      results = results.map((d) => ({
        ...d,
        distanceKm: calculateHaversineDistanceKm(userLat, userLng, d.latitude, d.longitude),
      }));

      // Proximity Sorting: Nearest disaster to user location is ALWAYS #1
      results.sort((a: any, b: any) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
    } else {
      // Baseline: Prioritize domestic Indian operational sector disasters
      const defaultNationalLat = 26.1445;
      const defaultNationalLng = 91.7362;
      results = results.map((d) => {
        const isIndia = d.latitude >= 6 && d.latitude <= 38 && d.longitude >= 68 && d.longitude <= 98;
        const dist = calculateHaversineDistanceKm(defaultNationalLat, defaultNationalLng, d.latitude, d.longitude);
        return {
          ...d,
          distanceKm: dist,
          isDomestic: isIndia,
        };
      });

      results.sort((a: any, b: any) => {
        if (a.isDomestic && !b.isDomestic) return -1;
        if (!a.isDomestic && b.isDomestic) return 1;
        return (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999);
      });
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

export async function syncLiveDisasters(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await DisasterIngestionService.syncAllLiveFeeds();
    return sendSuccess(res, {
      message: `Live feeds synchronized successfully. Ingested ${report.totalSynced} items.`,
      report,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLiveDisasterSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const totalActive = await prisma.disaster.count({ where: { status: 'ACTIVE' } });
    const usgsCount = await prisma.disaster.count({ where: { source: { contains: 'USGS' } } });
    const gdacsCount = await prisma.disaster.count({ where: { source: { contains: 'GDACS' } } });
    const eonetCount = await prisma.disaster.count({ where: { source: { contains: 'NASA' } } });
    const localCount = await prisma.disaster.count({
      where: {
        AND: [
          { NOT: { source: { contains: 'USGS' } } },
          { NOT: { source: { contains: 'GDACS' } } },
          { NOT: { source: { contains: 'NASA' } } },
        ],
      },
    });

    const recentCritical = await prisma.disaster.findMany({
      where: { severity: 'CRITICAL', status: 'ACTIVE' },
      take: 5,
      orderBy: { declaredAt: 'desc' },
    });

    return sendSuccess(res, {
      totalActive,
      sources: {
        usgs: usgsCount,
        gdacs: gdacsCount,
        nasaEonet: eonetCount,
        localOrAuthority: localCount,
      },
      recentCritical,
      lastEvaluatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

