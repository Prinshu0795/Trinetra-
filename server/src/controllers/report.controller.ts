// server/src/controllers/report.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';
import { generateTrackingCode } from '../utils/trackingCode.js';
import { alertBroadcaster } from '../services/AlertBroadcaster.js';

const prisma = new PrismaClient();

export async function submitReport(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      disasterId,
      citizenName,
      citizenPhone,
      disasterType,
      title,
      description,
      locationName,
      latitude,
      longitude,
    } = req.body;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError('Valid numeric latitude and longitude coordinates required', 400);
    }

    const trackingCode = await generateTrackingCode(prisma);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const report = await prisma.incidentReport.create({
      data: {
        trackingCode,
        disasterId: disasterId || null,
        citizenId: req.user?.id || null,
        citizenName: citizenName || req.user?.fullName || 'Anonymous Citizen',
        citizenPhone: citizenPhone || null,
        disasterType,
        title,
        description,
        locationName,
        latitude: lat,
        longitude: lng,
        imageUrl,
        status: 'PENDING_VERIFICATION',
        triagePriority: 'MEDIUM',
      },
    });

    alertBroadcaster.broadcast('INCIDENT_REPORTED', report);

    return sendSuccess(res, report, 201);
  } catch (error) {
    next(error);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, disasterType, priority, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (disasterType && disasterType !== 'ALL') {
      where.disasterType = disasterType;
    }
    if (priority && priority !== 'ALL') {
      where.triagePriority = priority;
    }

    const [total, reports] = await Promise.all([
      prisma.incidentReport.count({ where }),
      prisma.incidentReport.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          disaster: {
            select: { title: true },
          },
        },
      }),
    ]);

    return sendSuccess(res, reports, 200, {
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const report = await prisma.incidentReport.findFirst({
      where: {
        OR: [{ id }, { trackingCode: id }],
      },
      include: {
        disaster: {
          select: { id: true, title: true, severity: true },
        },
      },
    });

    if (!report) {
      throw new ApiError('Incident report not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
}

export async function triageReport(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status, triagePriority, authorityNotes, disasterId } = req.body;

    const report = await prisma.incidentReport.update({
      where: { id },
      data: {
        status,
        ...(triagePriority ? { triagePriority } : {}),
        ...(authorityNotes !== undefined ? { authorityNotes } : {}),
        ...(disasterId !== undefined ? { disasterId } : {}),
        verifiedById: req.user?.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'REPORT_TRIAGED',
        entityType: 'IncidentReport',
        entityId: report.id,
        details: JSON.stringify({ status, triagePriority, authorityNotes }),
      },
    });

    return sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
}
