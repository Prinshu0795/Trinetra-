// server/src/controllers/alert.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { alertBroadcaster } from '../services/AlertBroadcaster.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export async function listAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const statusParam = req.query.status as string | undefined;
    const severityParam = req.query.severity as string | undefined;
    const status = statusParam || 'ACTIVE';

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
      where.expiresAt = { gt: new Date() };
    }
    if (severityParam && severityParam !== 'ALL') {
      where.severity = severityParam;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: {
        author: {
          select: { fullName: true, department: true, badgeNumber: true },
        },
        disaster: {
          select: { title: true, type: true },
        },
      },
    });

    alerts.sort((a, b) => {
      const rankA = SEVERITY_ORDER[a.severity] || 99;
      const rankB = SEVERITY_ORDER[b.severity] || 99;
      return rankA - rankB;
    });

    return sendSuccess(res, alerts);
  } catch (error) {
    next(error);
  }
}

export async function createAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      disasterId,
      title,
      type,
      severity,
      targetAreaName,
      targetLatitude,
      targetLongitude,
      targetRadiusKm,
      headline,
      detailedMessage,
      actionInstructions,
      expiresInHours = 24,
    } = req.body;

    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const alert = await prisma.alert.create({
      data: {
        disasterId: disasterId || null,
        authorId: req.user!.id,
        title,
        type: type || 'WARNING',
        severity: severity || 'HIGH',
        status: 'ACTIVE',
        targetAreaName,
        targetLatitude,
        targetLongitude,
        targetRadiusKm: targetRadiusKm || 15.0,
        headline,
        detailedMessage,
        actionInstructions,
        source: req.user?.department || 'State Emergency Broadcast System',
        expiresAt,
      },
      include: {
        author: {
          select: { fullName: true, department: true },
        },
      },
    });

    alertBroadcaster.broadcast('ALERT_PUBLISHED', alert);

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ALERT_PUBLISHED',
        entityType: 'Alert',
        entityId: alert.id,
        details: JSON.stringify({ title, severity, targetAreaName }),
      },
    });

    return sendSuccess(res, alert, 201);
  } catch (error) {
    next(error);
  }
}

export async function withdrawAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
      },
    });

    alertBroadcaster.broadcast('ALERT_WITHDRAWN', alert);

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ALERT_WITHDRAWN',
        entityType: 'Alert',
        entityId: alert.id,
      },
    });

    return sendSuccess(res, alert);
  } catch (error) {
    next(error);
  }
}

export function streamAlerts(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  alertBroadcaster.registerClient(clientId, res);

  req.on('close', () => {
    alertBroadcaster.unregisterClient(clientId);
  });
}
