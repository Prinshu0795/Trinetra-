// server/src/services/seedService.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedScenario(db = prisma) {
  console.log('--- Starting TRINETRA Deterministic Scenario Seeding (SIH 26206) ---');

  // Clean dynamic tables in dependency order
  await db.floodBuffer.deleteMany();
  await db.auditLog.deleteMany();
  await db.incidentReport.deleteMany();
  await db.alert.deleteMany();
  await db.riskAssessment.deleteMany();
  await db.safeZone.deleteMany();
  await db.emergencyResource.deleteMany();
  await db.disaster.deleteMany();
  await db.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password123!', salt);

  // 1. Seed Users
  const authorityUser = await db.user.create({
    data: {
      email: 'authority@trinetra.gov.in',
      passwordHash: commonPasswordHash,
      fullName: 'Director S. K. Sharma',
      phone: '+91 94350 12345',
      role: 'AUTHORITY',
      badgeNumber: 'ASDMA-DIR-088',
      department: 'Assam State Disaster Management Authority (ASDMA)',
    },
  });

  const citizenUser = await db.user.create({
    data: {
      email: 'citizen@example.com',
      passwordHash: commonPasswordHash,
      fullName: 'Abhinav Verma',
      phone: '+91 98765 43210',
      role: 'CITIZEN',
    },
  });

  const responderUser = await db.user.create({
    data: {
      email: 'responder@ndrf.gov.in',
      passwordHash: commonPasswordHash,
      fullName: 'Inspector R. K. Singh',
      phone: '+91 98111 22334',
      role: 'RESPONDER',
      badgeNumber: 'NDRF-INS-142',
      department: 'NDRF 1st Battalion (Guwahati Base)',
    },
  });

  console.log('✓ Users created: Authority, Citizen, Responder');

  // 2. Seed Primary Disaster Scenario: Brahmaputra River Flood
  const disaster = await db.disaster.create({
    data: {
      title: 'Brahmaputra River Inundation & Embankment Breach',
      type: 'FLOOD',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      locationName: 'Guwahati, Kamrup Metropolitan, Assam',
      latitude: 26.1445,
      longitude: 91.7362,
      radiusKm: 25.0,
      description:
        'Water level in River Brahmaputra crossed highest danger level (51.5m). Severe inundation reported across low-lying wards with partial embankment failure near Pandu Ghat.',
      affectedPopulationEst: 140000,
      source: 'Central Water Commission (CWC) & ASDMA Operations Center',
      declaredAt: new Date(Date.now() - 6 * 3600 * 1000),
    },
  });

  console.log(`✓ Active Disaster created: ${disaster.title}`);

  // 3. Seed Safe Zones
  const safeZonesData = [
    {
      name: 'Guwahati Stadium Emergency Relief Camp',
      type: 'High Elevation Stadium',
      locationName: 'Nehru Stadium Complex, Ulubari, Guwahati',
      latitude: 26.1780,
      longitude: 91.7580,
      capacityTotal: 1200,
      capacityOccupied: 450,
      status: 'OPEN',
      elevationMeters: 68.0,
      amenities: JSON.stringify(['Drinking Water', 'First Aid Center', 'Power Generator', 'Dry Food Packets']),
      contactPerson: 'C. Baruah (Relief Officer)',
      contactPhone: '+91 98640 11223',
      source: 'District Disaster Management Authority (DDMA)',
    },
    {
      name: 'Cotton University High Ground Shelter',
      type: 'Educational Institution',
      locationName: 'Panbazar Campus, Guwahati',
      latitude: 26.1895,
      longitude: 91.7485,
      capacityTotal: 600,
      capacityOccupied: 580,
      status: 'NEAR_CAPACITY',
      elevationMeters: 62.5,
      amenities: JSON.stringify(['Drinking Water', 'Medical Camp', 'Sanitation Facilities']),
      contactPerson: 'Dr. P. Kalita',
      contactPhone: '+91 98640 33445',
      source: 'DDMA / Education Dept',
    },
    {
      name: 'Dispur Administrative Community Center',
      type: 'Reinforced Community Center',
      locationName: 'Capital Complex, Dispur, Guwahati',
      latitude: 26.1420,
      longitude: 91.7890,
      capacityTotal: 800,
      capacityOccupied: 210,
      status: 'OPEN',
      elevationMeters: 74.0,
      amenities: JSON.stringify(['Drinking Water', 'Kitchen Facility', 'Beds & Blankets', '24x7 Emergency Power']),
      contactPerson: 'M. Saikia',
      contactPhone: '+91 98640 55667',
      source: 'ASDMA State Operations',
    },
  ];

  for (const sz of safeZonesData) {
    await db.safeZone.create({ data: sz });
  }

  // 4. Seed Emergency Resources
  const resourcesData = [
    {
      name: 'Gauhati Medical College & Hospital (GMCH)',
      category: 'HOSPITAL',
      locationName: 'Narakasur Hilltop, Bhangagarh, Guwahati',
      latitude: 26.1550,
      longitude: 91.7700,
      contactNumber: '+91 361 2529457',
      status: 'AVAILABLE',
      details: 'Level-1 Trauma & Emergency Care Unit operational with elevated triage ward.',
      supplies: JSON.stringify({ emergencyBeds: 120, icuBeds: 24, ambulances: 8, oxygenAvailability: 'High' }),
      source: 'Directorate of Health Services, Assam',
    },
    {
      name: 'NDRF 1st Battalion Operations Base (Patgaon)',
      category: 'NDRF_UNIT',
      locationName: 'Patgaon, Rani Gate, Guwahati',
      latitude: 26.1150,
      longitude: 91.6050,
      contactNumber: '+91 361 2849005',
      status: 'ENGAGED',
      details: 'Deep water rescue teams actively deployed for boat evacuations along river corridor.',
      supplies: JSON.stringify({ inflatableRescueBoats: 14, deepDivers: 18, medicalFirstResponders: 60 }),
      source: 'National Disaster Response Force HQ',
    },
    {
      name: 'State Fire & Emergency Services Station',
      category: 'FIRE_STATION',
      locationName: 'Panbazar Riverfront, Guwahati',
      latitude: 26.1850,
      longitude: 91.7450,
      contactNumber: '101 / +91 361 2540222',
      status: 'AVAILABLE',
      details: 'High-capacity de-watering submersible pump vehicles and tree-clearing squads.',
      supplies: JSON.stringify({ highDischargePumps: 8, emergencyGenerators: 6, quickRescueVans: 4 }),
      source: 'Assam Fire & Emergency Services',
    },
  ];

  for (const res of resourcesData) {
    await db.emergencyResource.create({ data: res });
  }

  // 5. Seed Incident Reports
  const reportsData = [
    {
      trackingCode: 'RPT-2026-0001',
      disasterId: disaster.id,
      citizenId: citizenUser.id,
      citizenName: 'Abhinav Verma',
      citizenPhone: '+91 98765 43210',
      disasterType: 'FLOOD',
      title: 'Water rapidly entering ground floor near Bharalu River bridge',
      description:
        'Sluice gate backflow is causing water to surge into residential lane #3. 4 elderly citizens stranded on rooftop.',
      locationName: 'Bharalumukh, Guwahati',
      latitude: 26.1740,
      longitude: 91.7380,
      imageUrl: null,
      status: 'PENDING_VERIFICATION',
      triagePriority: 'HIGH',
    },
    {
      trackingCode: 'RPT-2026-0002',
      disasterId: disaster.id,
      citizenId: null,
      citizenName: 'Local Shopkeeper (Anonymous)',
      citizenPhone: '+91 94351 98765',
      disasterType: 'FLOOD',
      title: 'Road embankment collapsed on Jalukbari arterial road',
      description:
        'Road culvert caved in under intense drainage overflow. Traffic fully blocked; emergency vehicles cannot pass.',
      locationName: 'Jalukbari Point, Guwahati',
      latitude: 26.1470,
      longitude: 91.6620,
      imageUrl: null,
      status: 'VERIFIED',
      triagePriority: 'CRITICAL',
      authorityNotes: 'Verified via Police Traffic CCTV feed. Traffic diversion activated towards NH-27 bypass.',
      verifiedById: authorityUser.id,
    },
  ];

  for (const rpt of reportsData) {
    await db.incidentReport.create({ data: rpt });
  }

  // 6. Seed Active Broadcast Alerts
  const alertsData = [
    {
      disasterId: disaster.id,
      authorId: authorityUser.id,
      title: 'URGENT: Brahmaputra River Spillage Warning & Evacuation Order',
      type: 'EVACUATION_ORDER',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      targetAreaName: 'Kamrup Metropolitan & Riverbank Wards 1-14',
      targetLatitude: 26.1445,
      targetLongitude: 91.7362,
      targetRadiusKm: 20.0,
      headline: 'IMMEDIATE EVACUATION ADVISED FOR RIVERBANK RESIDENTS',
      detailedMessage:
        'Brahmaputra water level continues to rise at 4cm/hour. All residents within 500m of river embankment are ordered to evacuate immediately to designated safe shelters. Do not attempt to cross flooded underpasses.',
      actionInstructions:
        '1. Switch off main electricity breakers.\n2. Carry identification, essential medicines, and torch.\n3. Move immediately towards Nehru Stadium Relief Camp or Dispur Center.\n4. Call 1070 or 112 for NDRF water rescue.',
      source: 'Assam State Disaster Management Authority (ASDMA)',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
    {
      disasterId: disaster.id,
      authorId: authorityUser.id,
      title: 'Heavy Rainfall & Flash Flood Advisory for Guwahati Hills',
      type: 'ADVISORY',
      severity: 'HIGH',
      status: 'ACTIVE',
      targetAreaName: 'Guwahati Metropolitan Region & Foothills',
      targetLatitude: 26.1445,
      targetLongitude: 91.7362,
      targetRadiusKm: 30.0,
      headline: 'Severe rainfall warning for next 18 hours',
      detailedMessage:
        'Regional Meteorological Centre forecasts intense thunderstorms (120-160mm) triggering localized hill landslides and flash flooding.',
      actionInstructions:
        'Avoid hillslope settlements. Keep emergency phones charged. Store 3 days of potable drinking water.',
      source: 'India Meteorological Department (IMD) Guwahati',
      expiresAt: new Date(Date.now() + 18 * 3600 * 1000),
    },
  ];

  for (const alt of alertsData) {
    await db.alert.create({ data: alt });
  }

  // 7. Seed Initial Risk Assessment
  await db.riskAssessment.create({
    data: {
      disasterId: disaster.id,
      locationName: 'Guwahati Metropolitan',
      latitude: 26.1445,
      longitude: 91.7362,
      riskLevel: 'SEVERE',
      riskScore: 88.5,
      floodRisk: 92.0,
      cycloneRisk: 25.0,
      landslideRisk: 65.0,
      confidenceScore: 0.91,
      modelVersion: 'TRINETRA-HYBRID-RULE-v1.2',
      factorsJson: JSON.stringify([
        { name: 'River Water Level vs Danger Mark', weight: 0.45, value: '+1.8m above danger mark' },
        { name: '24h Precipitation Accumulation', weight: 0.3, value: '142mm recorded' },
        { name: 'Embankment Integrity Metric', weight: 0.25, value: 'Compromised at Pandu sector' },
      ]),
      explanationText:
        'Compound hazard analysis flags Guwahati urban core under severe flood emergency driven by high Brahmaputra discharge coupled with prolonged monsoon rainfall.',
      advisoryText:
        'Enforce mandatory evacuation of low-lying floodplains. Keep all medical and NDRF rescue units on red alert.',
      isFallback: false,
    },
  });

  // 9. Seed Demo Flood Buffers
  await db.floodBuffer.create({
    data: {
      name: 'Ayodhya Saryu River Flood Zone Model',
      geometryGeojson: '{"type":"Polygon","coordinates":[[[82.18,26.81],[82.22,26.81],[82.22,26.78],[82.18,26.78],[82.18,26.81]]]}',
      riskLevel: 'HIGH',
      source: 'TRINETRA DEMO DATA',
    }
  });
  await db.floodBuffer.create({
    data: {
      name: 'Lucknow Gomti Basin Buffer',
      geometryGeojson: '{"type":"Polygon","coordinates":[[[80.90,26.86],[80.98,26.86],[80.98,26.83],[80.90,26.83],[80.90,26.86]]]}',
      riskLevel: 'MODERATE',
      source: 'TRINETRA DEMO DATA',
    }
  });

  console.log('--- TRINETRA Seed Completed Successfully! ---');
}
