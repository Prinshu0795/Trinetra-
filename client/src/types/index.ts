// client/src/types/index.ts

export type Role = 'CITIZEN' | 'AUTHORITY' | 'RESPONDER';

export type DisasterType =
  | 'FLOOD'
  | 'CYCLONE'
  | 'EARTHQUAKE'
  | 'LANDSLIDE'
  | 'WILDFIRE'
  | 'TSUNAMI'
  | 'URBAN_EMERGENCY';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DisasterStatus = 'MONITORING' | 'ACTIVE' | 'CONTAINED' | 'RESOLVED';

export type AlertType = 'ADVISORY' | 'WATCH' | 'WARNING' | 'EVACUATION_ORDER';

export type AlertStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'WITHDRAWN';

export type ReportStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'INVESTIGATING'
  | 'DISPATCHED'
  | 'REJECTED'
  | 'RESOLVED';

export type SafeZoneStatus = 'OPEN' | 'NEAR_CAPACITY' | 'FULL' | 'STANDBY' | 'CLOSED';

export type ResourceCategory =
  | 'HOSPITAL'
  | 'RELIEF_CAMP'
  | 'FIRE_STATION'
  | 'POLICE_STATION'
  | 'NDRF_UNIT'
  | 'SUPPLY_DEPOT'
  | 'AMBULANCE_BASE';

export type ResourceStatus = 'AVAILABLE' | 'ENGAGED' | 'DEPLETED' | 'STANDBY';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  badgeNumber?: string | null;
  department?: string | null;
  createdAt: string;
}

export interface Disaster {
  id: string;
  title: string;
  type: DisasterType;
  severity: SeverityLevel;
  status: DisasterStatus;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  description: string;
  affectedPopulationEst: number;
  source: string;
  declaredAt: string;
  containedAt?: string | null;
  updatedAt: string;
  distanceKm?: number;
  alertCount?: number;
  reportCount?: number;
}

export interface Alert {
  id: string;
  disasterId?: string | null;
  authorId: string;
  title: string;
  type: AlertType;
  severity: SeverityLevel;
  status: AlertStatus;
  targetAreaName: string;
  targetLatitude: number;
  targetLongitude: number;
  targetRadiusKm: number;
  headline: string;
  detailedMessage: string;
  actionInstructions: string;
  source: string;
  issuedAt: string;
  expiresAt: string;
  withdrawnAt?: string | null;
}

export interface IncidentReport {
  id: string;
  trackingCode: string;
  disasterId?: string | null;
  citizenId?: string | null;
  citizenName?: string | null;
  citizenPhone?: string | null;
  disasterType: DisasterType;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  status: ReportStatus;
  triagePriority: SeverityLevel;
  authorityNotes?: string | null;
  verifiedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SafeZone {
  id: string;
  name: string;
  type: string;
  locationName: string;
  latitude: number;
  longitude: number;
  capacityTotal: number;
  capacityOccupied: number;
  status: SafeZoneStatus;
  amenities: string;
  contactPerson?: string | null;
  contactPhone?: string | null;
  elevationMeters?: number | null;
  source: string;
  lastVerifiedAt: string;
  distanceKm?: number;
}

export interface EmergencyResource {
  id: string;
  name: string;
  category: ResourceCategory;
  locationName: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  status: ResourceStatus;
  details: string;
  supplies?: string | null;
  source: string;
  lastVerifiedAt: string;
  distanceKm?: number;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: string;
}

export interface RiskAssessment {
  locationName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidenceScore: number;
  primaryThreat: string;
  factors: RiskFactor[];
  explanation: string;
  recommendedAction: string;
  modelVersion: string;
  isFallback: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    provenance?: string;
    isFallback?: boolean;
  };
}
