// server/src/schemas/index.ts
import { z } from 'zod';

// Shared domain enumerations (enforced at application boundary)
export const RoleEnum = z.enum(['CITIZEN', 'AUTHORITY', 'RESPONDER', 'ADMIN']);


export const DisasterTypeEnum = z.enum([
  'FLOOD',
  'CYCLONE',
  'EARTHQUAKE',
  'LANDSLIDE',
  'WILDFIRE',
  'TSUNAMI',
  'URBAN_EMERGENCY',
]);

export const SeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const DisasterStatusEnum = z.enum([
  'MONITORING',
  'ACTIVE',
  'CONTAINED',
  'RESOLVED',
]);

export const AlertTypeEnum = z.enum([
  'ADVISORY',
  'WATCH',
  'WARNING',
  'EVACUATION_ORDER',
]);

export const AlertStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'WITHDRAWN']);

export const ReportStatusEnum = z.enum([
  'PENDING_VERIFICATION',
  'VERIFIED',
  'INVESTIGATING',
  'DISPATCHED',
  'REJECTED',
  'RESOLVED',
]);

export const SafeZoneStatusEnum = z.enum([
  'OPEN',
  'NEAR_CAPACITY',
  'FULL',
  'STANDBY',
  'CLOSED',
]);

export const ResourceCategoryEnum = z.enum([
  'HOSPITAL',
  'RELIEF_CAMP',
  'FIRE_STATION',
  'POLICE_STATION',
  'NDRF_UNIT',
  'SUPPLY_DEPOT',
  'AMBULANCE_BASE',
]);

export const ResourceStatusEnum = z.enum([
  'AVAILABLE',
  'ENGAGED',
  'DEPLETED',
  'STANDBY',
]);

export const RiskLevelEnum = z.enum(['LOW', 'MODERATE', 'HIGH', 'SEVERE']);

// Request Schemas
export const registerSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  role: RoleEnum.default('CITIZEN'),
  badgeNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password required'),
});

export const createDisasterSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: DisasterTypeEnum,
  severity: SeverityEnum,
  status: DisasterStatusEnum.default('ACTIVE'),
  locationName: z.string().min(2, 'Location name required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().positive().default(10.0),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  affectedPopulationEst: z.number().int().nonnegative().default(0),
});

export const updateDisasterSchema = z.object({
  title: z.string().min(3).optional(),
  type: DisasterTypeEnum.optional(),
  severity: SeverityEnum.optional(),
  status: DisasterStatusEnum.optional(),
  locationName: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().positive().optional(),
  description: z.string().optional(),
  affectedPopulationEst: z.number().int().nonnegative().optional(),
  containedAt: z.string().datetime().optional().nullable(),
});

export const createAlertSchema = z.object({
  disasterId: z.string().uuid().optional().nullable(),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  type: AlertTypeEnum.default('WARNING'),
  severity: SeverityEnum.default('HIGH'),
  targetAreaName: z.string().min(2, 'Target area name required'),
  targetLatitude: z.number().min(-90).max(90),
  targetLongitude: z.number().min(-180).max(180),
  targetRadiusKm: z.number().positive().default(15.0),
  headline: z.string().min(5, 'Headline required'),
  detailedMessage: z.string().min(10, 'Detailed message required'),
  actionInstructions: z.string().min(5, 'Action instructions required'),
  expiresInHours: z.number().positive().default(24),
});

export const createReportSchema = z.object({
  disasterId: z.string().uuid().optional().nullable(),
  citizenName: z.string().optional(),
  citizenPhone: z.string().optional(),
  disasterType: DisasterTypeEnum,
  title: z.string().min(3, 'Title required'),
  description: z.string().min(5, 'Description required'),
  locationName: z.string().min(2, 'Location required'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const triageReportSchema = z.object({
  status: ReportStatusEnum,
  triagePriority: SeverityEnum.optional(),
  authorityNotes: z.string().optional(),
  disasterId: z.string().uuid().optional().nullable(),
});

export const createSafeZoneSchema = z.object({
  name: z.string().min(2),
  type: z.string().default('Shelter'),
  locationName: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacityTotal: z.number().int().positive(),
  capacityOccupied: z.number().int().nonnegative().default(0),
  status: SafeZoneStatusEnum.default('OPEN'),
  amenities: z.string().default('["Drinking Water", "First Aid"]'),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  elevationMeters: z.number().optional(),
});

export const updateSafeZoneOccupancySchema = z.object({
  capacityOccupied: z.number().int().nonnegative(),
  status: SafeZoneStatusEnum.optional(),
});

export const createResourceSchema = z.object({
  name: z.string().min(2),
  category: ResourceCategoryEnum,
  locationName: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contactNumber: z.string().min(3),
  status: ResourceStatusEnum.default('AVAILABLE'),
  details: z.string().default(''),
  supplies: z.string().optional(),
});

export const updateResourceStatusSchema = z.object({
  status: ResourceStatusEnum.optional(),
  details: z.string().optional(),
  supplies: z.string().optional(),
});

export const relayPacketSchema = z.object({
  packetId: z.string().min(3),
  victimName: z.string().min(1),
  victimPhone: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitudeMeters: z.number().optional().nullable(),
  emergencyType: z.string().default('FLOOD_TRAPPED'),
  severity: SeverityEnum.default('CRITICAL'),
  message: z.string().min(1),
  batteryLevel: z.number().int().min(0).max(100).optional().nullable(),
  hopCount: z.number().int().min(0).default(0),
  relayChainJson: z.string().default('[]'),
  originTimestamp: z.string().optional().nullable(),
  gatewayNodeId: z.string().optional().nullable(),
});

export const batchRelaySchema = z.object({
  gatewayNodeId: z.string().optional().nullable(),
  packets: z.array(relayPacketSchema),
});

