// server/src/utils/trackingCode.ts
import { PrismaClient } from '@prisma/client';

export async function generateTrackingCode(prisma: PrismaClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const totalCount = await prisma.incidentReport.count();
  const sequence = String(totalCount + 1).padStart(4, '0');
  return `RPT-${currentYear}-${sequence}`;
}
