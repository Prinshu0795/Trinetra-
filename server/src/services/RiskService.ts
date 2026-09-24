// server/src/services/RiskService.ts
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { calculateHaversineDistanceKm } from '../utils/gis.js';

const prisma = new PrismaClient();

export interface RiskEvaluationResult {
  locationName: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  confidenceScore: number;
  primaryThreat: string;
  factors: Array<{ name: string; weight: number; value: string }>;
  explanation: string;
  recommendedAction: string;
  modelVersion: string;
  isFallback: boolean;
}

export class RiskService {
  /**
   * Evaluate risk for a given location or coordinates.
   * Attempts external ML service (Prinshu's handoff) and falls back to deterministic heuristic engine.
   */
  static async evaluateRisk(
    locationQuery: string,
    lat?: number,
    lng?: number
  ): Promise<RiskEvaluationResult> {
    // 1. If external AI/ML service URL configured, attempt call
    if (config.riskServiceUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const response = await fetch(`${config.riskServiceUrl}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: locationQuery,
            latitude: lat,
            longitude: lng,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data: any = await response.json();
          if (data && data.riskScore !== undefined) {
            return {
              ...data,
              isFallback: false,
            };
          }
        }
      } catch (err: any) {
        console.warn(
          `[RiskService] ML service unavailable at ${config.riskServiceUrl}. Engaging TRINETRA deterministic fallback engine: ${err.message}`
        );
      }
    }

    // 2. Deterministic Fallback Engine
    return this.evaluateDeterministicFallback(locationQuery, lat, lng);
  }

  /**
   * Deterministic mathematical evaluation based on distance to nearest active hazard epicenters
   */
  private static async evaluateDeterministicFallback(
    locationQuery: string,
    targetLat?: number,
    targetLng?: number
  ): Promise<RiskEvaluationResult> {
    const activeDisasters = await prisma.disaster.findMany({
      where: { status: 'ACTIVE' },
    });

    if (activeDisasters.length === 0) {
      return {
        locationName: locationQuery || 'Regional Sector',
        riskScore: 12.0,
        riskLevel: 'LOW',
        confidenceScore: 0.95,
        primaryThreat: 'NONE_DETECTED',
        factors: [{ name: 'Regional Monitoring', weight: 1.0, value: 'No active disaster incidents reported' }],
        explanation: 'All monitored hydrological and weather indices are within normal safety baselines.',
        recommendedAction: 'Standard situational readiness. No evacuation or emergency precautions needed.',
        modelVersion: 'TRINETRA-FALLBACK-HEURISTIC-v1.2',
        isFallback: true,
      };
    }

    const queryLat = targetLat !== undefined ? targetLat : activeDisasters[0].latitude;
    const queryLng = targetLng !== undefined ? targetLng : activeDisasters[0].longitude;

    let nearestDisaster = activeDisasters[0];
    let minDistanceKm = calculateHaversineDistanceKm(
      nearestDisaster.latitude,
      nearestDisaster.longitude,
      queryLat,
      queryLng
    );

    for (const d of activeDisasters) {
      const dist = calculateHaversineDistanceKm(d.latitude, d.longitude, queryLat, queryLng);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        nearestDisaster = d;
      }
    }

    const ratio = Math.max(0, 1 - minDistanceKm / nearestDisaster.radiusKm);

    let baseScore = 20;
    if (nearestDisaster.severity === 'CRITICAL') {
      baseScore = Math.round(55 + ratio * 43);
    } else if (nearestDisaster.severity === 'HIGH') {
      baseScore = Math.round(40 + ratio * 40);
    } else if (nearestDisaster.severity === 'MEDIUM') {
      baseScore = Math.round(25 + ratio * 35);
    } else {
      baseScore = Math.round(15 + ratio * 20);
    }

    const clampedScore = Math.min(99.0, Math.max(10.0, baseScore));

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' = 'LOW';
    if (clampedScore >= 75) riskLevel = 'SEVERE';
    else if (clampedScore >= 55) riskLevel = 'HIGH';
    else if (clampedScore >= 35) riskLevel = 'MODERATE';

    const explanation = `Location is ${minDistanceKm} km from the active ${nearestDisaster.title} epicenter (declared hazard radius: ${nearestDisaster.radiusKm} km). Severity weighting: ${nearestDisaster.severity}.`;

    const recommendedAction =
      clampedScore >= 70
        ? 'Urgent evacuation recommended. Locate nearest safe high-elevation shelter and avoid all floodplains.'
        : clampedScore >= 50
        ? 'High caution advised. Prepare 72-hour emergency go-bag and keep communication lines open.'
        : 'Monitor ASDMA emergency bulletins and maintain normal readiness.';

    return {
      locationName: locationQuery || nearestDisaster.locationName,
      riskScore: clampedScore,
      riskLevel,
      confidenceScore: 0.88,
      primaryThreat: nearestDisaster.type,
      factors: [
        {
          name: 'Proximity to Epicenter',
          weight: 0.6,
          value: `${minDistanceKm} km from epicenter (${Math.round(ratio * 100)}% depth inside hazard radius)`,
        },
        {
          name: 'Hazard Severity Index',
          weight: 0.4,
          value: `${nearestDisaster.severity} (${nearestDisaster.type})`,
        },
      ],
      explanation,
      recommendedAction,
      modelVersion: 'TRINETRA-FALLBACK-HEURISTIC-v1.2',
      isFallback: true,
    };
  }
}
