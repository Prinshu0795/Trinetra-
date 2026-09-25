-- ====================================================================
-- TRINETRA (SIH 26206) - Complete All-In-One Supabase Setup Script
-- Everything in ONE file: Tables + RLS + Triggers + Realtime + Seed Data + Storage
-- 
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/cuzgxbpkjfpyytxdisez
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "RUN"
-- ====================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Core Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'CITIZEN', -- CITIZEN | AUTHORITY | RESPONDER | ADMIN
  badge_number TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Disasters Table
CREATE TABLE IF NOT EXISTS public.disasters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- FLOOD | CYCLONE | EARTHQUAKE | LANDSLIDE | WILDFIRE | TSUNAMI | URBAN_EMERGENCY
  severity TEXT NOT NULL, -- LOW | MEDIUM | HIGH | CRITICAL
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- MONITORING | ACTIVE | CONTAINED | RESOLVED
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 10.0,
  description TEXT NOT NULL,
  affected_population_est INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'IMD / CWC / Disaster Authority',
  declared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contained_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES public.disasters(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'WARNING', -- ADVISORY | WATCH | WARNING | EVACUATION_ORDER
  severity TEXT NOT NULL DEFAULT 'HIGH', -- LOW | MEDIUM | HIGH | CRITICAL
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- DRAFT | ACTIVE | EXPIRED | WITHDRAWN
  target_area_name TEXT NOT NULL,
  target_latitude DOUBLE PRECISION NOT NULL,
  target_longitude DOUBLE PRECISION NOT NULL,
  target_radius_km DOUBLE PRECISION NOT NULL DEFAULT 15.0,
  headline TEXT NOT NULL,
  detailed_message TEXT NOT NULL,
  action_instructions TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'National Disaster Management Authority',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Incident Reports Table
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_code TEXT UNIQUE NOT NULL,
  disaster_id UUID REFERENCES public.disasters(id) ON DELETE SET NULL,
  citizen_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  citizen_name TEXT,
  citizen_phone TEXT,
  disaster_type TEXT NOT NULL, -- FLOOD | CYCLONE | EARTHQUAKE | LANDSLIDE | WILDFIRE | TSUNAMI | URBAN_EMERGENCY
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION | VERIFIED | INVESTIGATING | DISPATCHED | REJECTED | RESOLVED
  triage_priority TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH | CRITICAL
  authority_notes TEXT,
  verified_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Safe Zones & Evacuation Shelters
CREATE TABLE IF NOT EXISTS public.safe_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Shelter | Community Center | School | High Ground
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity_total INTEGER NOT NULL,
  capacity_occupied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN | NEAR_CAPACITY | FULL | STANDBY | CLOSED
  amenities TEXT, -- JSON array string
  contact_person TEXT,
  contact_phone TEXT,
  elevation_meters DOUBLE PRECISION,
  source TEXT NOT NULL DEFAULT 'District Administration',
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Emergency Resources (Hospitals, NDRF, Fire, Police)
CREATE TABLE IF NOT EXISTS public.emergency_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- HOSPITAL | RELIEF_CAMP | FIRE_STATION | POLICE_STATION | NDRF_UNIT | SUPPLY_DEPOT | AMBULANCE_BASE
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  contact_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | ENGAGED | DEPLETED | STANDBY
  details TEXT NOT NULL,
  supplies TEXT, -- JSON object string
  source TEXT NOT NULL DEFAULT 'State Emergency Operations Center',
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Risk Assessments
CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES public.disasters(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  risk_level TEXT NOT NULL, -- LOW | MODERATE | HIGH | SEVERE
  risk_score DOUBLE PRECISION NOT NULL,
  flood_risk DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  cyclone_risk DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  landslide_risk DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.85,
  model_version TEXT NOT NULL DEFAULT 'TRINETRA-HYBRID-RULE-v1.2',
  factors_json TEXT NOT NULL,
  explanation_text TEXT NOT NULL,
  advisory_text TEXT NOT NULL,
  is_fallback BOOLEAN NOT NULL DEFAULT false,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Flood Buffers
CREATE TABLE IF NOT EXISTS public.flood_buffers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  geometry_geojson TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Relay Mesh Packets
CREATE TABLE IF NOT EXISTS public.relay_packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  packet_id TEXT UNIQUE NOT NULL,
  victim_name TEXT NOT NULL,
  victim_phone TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude_meters DOUBLE PRECISION,
  emergency_type TEXT NOT NULL DEFAULT 'FLOOD_TRAPPED',
  severity TEXT NOT NULL DEFAULT 'CRITICAL',
  message TEXT NOT NULL,
  battery_level INTEGER,
  hop_count INTEGER NOT NULL DEFAULT 0,
  relay_chain_json TEXT NOT NULL,
  origin_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  gateway_node_id TEXT,
  status TEXT NOT NULL DEFAULT 'DELIVERED',
  dispatched112_at TIMESTAMPTZ,
  responder_notes TEXT,
  incident_report_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_disasters_status ON public.disasters(status);
CREATE INDEX IF NOT EXISTS idx_disasters_coords ON public.disasters(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_expires ON public.alerts(expires_at);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON public.incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_tracking ON public.incident_reports(tracking_code);
CREATE INDEX IF NOT EXISTS idx_incident_reports_coords ON public.incident_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_safe_zones_status ON public.safe_zones(status);
CREATE INDEX IF NOT EXISTS idx_emergency_resources_cat ON public.emergency_resources(category);
CREATE INDEX IF NOT EXISTS idx_relay_packets_packet_id ON public.relay_packets(packet_id);

-- ====================================================================
-- Automatic User Profile Synchronization Trigger
-- When a user registers through Supabase Auth, their profile is automatically inserted into public.users
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role, badge_number, department)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'fullName', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'CITIZEN'),
    new.raw_user_meta_data->>'badgeNumber',
    new.raw_user_meta_data->>'department'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read profiles" ON public.users;
CREATE POLICY "Allow users to read profiles" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow user self-insert and update" ON public.users;
CREATE POLICY "Allow user self-insert and update" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read disasters" ON public.disasters;
CREATE POLICY "Allow public read disasters" ON public.disasters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage disasters" ON public.disasters;
CREATE POLICY "Allow manage disasters" ON public.disasters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read alerts" ON public.alerts;
CREATE POLICY "Allow public read alerts" ON public.alerts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage alerts" ON public.alerts;
CREATE POLICY "Allow manage alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read incident reports" ON public.incident_reports;
CREATE POLICY "Allow read incident reports" ON public.incident_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow citizen report insert" ON public.incident_reports;
CREATE POLICY "Allow citizen report insert" ON public.incident_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow triage update" ON public.incident_reports;
CREATE POLICY "Allow triage update" ON public.incident_reports FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read safe zones" ON public.safe_zones;
CREATE POLICY "Allow public read safe zones" ON public.safe_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage safe zones" ON public.safe_zones;
CREATE POLICY "Allow manage safe zones" ON public.safe_zones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read emergency resources" ON public.emergency_resources;
CREATE POLICY "Allow public read emergency resources" ON public.emergency_resources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage emergency resources" ON public.emergency_resources;
CREATE POLICY "Allow manage emergency resources" ON public.emergency_resources FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow relay packets read" ON public.relay_packets;
CREATE POLICY "Allow relay packets read" ON public.relay_packets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow relay packets insert" ON public.relay_packets;
CREATE POLICY "Allow relay packets insert" ON public.relay_packets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow risk assessments read" ON public.risk_assessments;
CREATE POLICY "Allow risk assessments read" ON public.risk_assessments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow risk assessments manage" ON public.risk_assessments;
CREATE POLICY "Allow risk assessments manage" ON public.risk_assessments FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- Realtime Broadcast Subscriptions
-- Enables live web updates for alerts and incident submissions
-- ====================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_reports;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.disasters;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ====================================================================
-- Storage Bucket for Incident Photo Uploads
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-proofs', 'incident-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read incident photos" ON storage.objects;
CREATE POLICY "Public read incident photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'incident-proofs');

DROP POLICY IF EXISTS "Public upload incident photos" ON storage.objects;
CREATE POLICY "Public upload incident photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'incident-proofs');

-- ====================================================================
-- Deterministic Seed Data (Active Scenarios, Shelters & Resources)
-- Populates full operational demo immediately upon running
-- ====================================================================

-- 1. Active Primary Disaster
INSERT INTO public.disasters (
  id, title, type, severity, status, location_name, latitude, longitude, radius_km,
  description, affected_population_est, source, declared_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Brahmaputra River Inundation & Embankment Breach',
  'FLOOD',
  'CRITICAL',
  'ACTIVE',
  'Guwahati, Kamrup Metropolitan, Assam',
  26.1445,
  91.7362,
  25.0,
  'Water level in River Brahmaputra crossed danger mark (51.5m). Severe inundation across low-lying wards with partial embankment breach near Pandu Ghat.',
  140000,
  'Central Water Commission (CWC) & ASDMA Operations Center',
  now() - interval '6 hours'
) ON CONFLICT (id) DO NOTHING;

-- 2. Broadcast Alerts
INSERT INTO public.alerts (
  id, disaster_id, title, type, severity, status, target_area_name,
  target_latitude, target_longitude, target_radius_km, headline,
  detailed_message, action_instructions, source, issued_at, expires_at
) VALUES (
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'URGENT: Brahmaputra River Spillage Warning & Evacuation Order',
  'EVACUATION_ORDER',
  'CRITICAL',
  'ACTIVE',
  'Kamrup Metropolitan & Riverbank Wards 1-14',
  26.1445,
  91.7362,
  20.0,
  'IMMEDIATE EVACUATION ADVISED FOR RIVERBANK RESIDENTS',
  'Brahmaputra water level continues to surge. All residents within 500m of river embankment are ordered to move to designated elevated safe shelters immediately.',
  '1. Turn off main circuit breakers.\n2. Carry ID and emergency medicines.\n3. Head to Nehru Stadium Relief Camp.\n4. Call 1070 or 112 for water rescue.',
  'Assam State Disaster Management Authority (ASDMA)',
  now() - interval '2 hours',
  now() + interval '24 hours'
),
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Heavy Rainfall & Flash Flood Advisory for Guwahati Foothills',
  'ADVISORY',
  'HIGH',
  'ACTIVE',
  'Guwahati Metropolitan Region & Foothills',
  26.1445,
  91.7362,
  30.0,
  'Severe rainfall warning for next 18 hours',
  'Regional Meteorological Centre forecasts intense rainfall (120-160mm) triggering localized hill landslides and flash waterlogging.',
  'Avoid hillslope settlements. Keep mobile devices fully charged. Store 3 days of potable drinking water.',
  'India Meteorological Department (IMD) Guwahati',
  now() - interval '1 hour',
  now() + interval '18 hours'
) ON CONFLICT (id) DO NOTHING;

-- 3. Emergency Resources
INSERT INTO public.emergency_resources (
  id, name, category, location_name, latitude, longitude, contact_number, status, details, supplies, source
) VALUES (
  '33333333-3333-3333-3333-333333333331',
  'Gauhati Medical College & Hospital (GMCH)',
  'HOSPITAL',
  'Narakasur Hilltop, Bhangagarh, Guwahati',
  26.1550,
  91.7700,
  '+91 361 2529457',
  'AVAILABLE',
  'Level-1 Trauma & Emergency Care Unit operational with elevated triage ward.',
  '{"emergencyBeds": 120, "icuBeds": 24, "ambulances": 8, "oxygenAvailability": "High"}',
  'Directorate of Health Services, Assam'
),
(
  '33333333-3333-3333-3333-333333333332',
  'NDRF 1st Battalion Operations Base (Patgaon)',
  'NDRF_UNIT',
  'Patgaon, Rani Gate, Guwahati',
  26.1150,
  91.6050,
  '+91 361 2849005',
  'ENGAGED',
  'Deep water rescue teams actively deployed for boat evacuations along river corridor.',
  '{"inflatableRescueBoats": 14, "deepDivers": 18, "medicalFirstResponders": 60}',
  'National Disaster Response Force HQ'
),
(
  '33333333-3333-3333-3333-333333333333',
  'State Fire & Emergency Services Station',
  'FIRE_STATION',
  'Panbazar Riverfront, Guwahati',
  26.1850,
  91.7450,
  '101 / +91 361 2540222',
  'AVAILABLE',
  'High-capacity de-watering submersible pump vehicles and tree-clearing squads on standby.',
  '{"highDischargePumps": 8, "emergencyGenerators": 6, "quickRescueVans": 4}',
  'Assam Fire & Emergency Services'
) ON CONFLICT (id) DO NOTHING;

-- 4. Safe Zones & Shelters
INSERT INTO public.safe_zones (
  id, name, type, location_name, latitude, longitude, capacity_total,
  capacity_occupied, status, amenities, contact_person, contact_phone, elevation_meters, source
) VALUES (
  '44444444-4444-4444-4444-444444444441',
  'Nehru Stadium Elevated Relief Shelter',
  'Shelter',
  'B. Baruah Road, Ulubari, Guwahati',
  26.1780,
  91.7580,
  1200,
  340,
  'OPEN',
  '["Food Rations", "Drinking Water", "First Aid Station", "Power Backup", "Sanitation Kits"]',
  'Officer In-Charge M. Das',
  '+91 94350 99881',
  64.5,
  'Kamrup Metro District Administration'
),
(
  '44444444-4444-4444-4444-444444444442',
  'Dispur Government High School Evacuation Center',
  'School',
  'Ganeshguri, Dispur, Guwahati',
  26.1480,
  91.7890,
  600,
  120,
  'OPEN',
  '["Cooked Meals", "Clean Water Tanker", "Mobile Medical Unit", "Blankets"]',
  'Nodal Officer B. Kalita',
  '+91 98640 11223',
  71.0,
  'Kamrup Metro District Administration'
) ON CONFLICT (id) DO NOTHING;

-- 5. Sample Incident Reports
INSERT INTO public.incident_reports (
  id, tracking_code, disaster_id, citizen_name, citizen_phone, disaster_type,
  title, description, location_name, latitude, longitude, status, triage_priority, created_at
) VALUES (
  '55555555-5555-5555-5555-555555555551',
  'RPT-2026-0001',
  '11111111-1111-1111-1111-111111111111',
  'Abhinav Verma',
  '+91 98765 43210',
  'FLOOD',
  'Water rapidly rising near Bharalu river bridge',
  'Sluice gate backflow is causing water to surge into residential lane #3. 4 elderly citizens stranded on 1st floor.',
  'Bharalumukh, Guwahati',
  26.1740,
  91.7380,
  'PENDING_VERIFICATION',
  'HIGH',
  now() - interval '3 hours'
),
(
  '55555555-5555-5555-5555-555555555552',
  'RPT-2026-0002',
  '11111111-1111-1111-1111-111111111111',
  'Local Eyewitness',
  '+91 94351 98765',
  'FLOOD',
  'Road embankment collapsed on Jalukbari point',
  'Drainage overflow caused road culvert to collapse. Traffic fully blocked; emergency vehicles cannot cross.',
  'Jalukbari Point, Guwahati',
  26.1470,
  91.6620,
  'VERIFIED',
  'CRITICAL',
  now() - interval '1 hour'
) ON CONFLICT (id) DO NOTHING;
