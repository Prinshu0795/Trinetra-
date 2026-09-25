// client/src/lib/supabase.ts
/**
 * TRINETRA Supabase & RBAC Integration Layer
 * 
 * Supports:
 * - Supabase Auth (Sign-in, Sign-up, Session persistence)
 * - Public schema data operations (public.users, public.incident_reports)
 * - Seamless fallback & dual-sync with TRINETRA Express/Prisma API
 */

import { createClient } from '@supabase/supabase-js';
import { Role, User, DisasterType } from '../types';

export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://cuzgxbpkjfpyytxdisez.supabase.co';
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1emd4YnBramZweXl0eGRpc2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNTg2NzMsImV4cCI6MjEwNTgzNDY3M30.4poVm2jxbpV1Df_CprcJq76me-1mvkoBhV4rPzZmVn0';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Maps a Supabase Auth User object to the TRINETRA User model
 */
export function mapSupabaseUserToTrinetraUser(supabaseUser: any, dbUser?: any): User {
  const metadata = supabaseUser?.user_metadata || {};
  const appMeta = supabaseUser?.app_metadata || {};

  const assignedRole: Role =
    dbUser?.role ||
    appMeta.role ||
    metadata.role ||
    (metadata.badgeNumber ? 'AUTHORITY' : 'CITIZEN');

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: dbUser?.full_name || metadata.fullName || metadata.name || supabaseUser.email?.split('@')[0] || 'User',
    phone: dbUser?.phone || metadata.phone || supabaseUser.phone || null,
    role: assignedRole,
    badgeNumber: dbUser?.badge_number || metadata.badgeNumber || null,
    department: dbUser?.department || metadata.department || null,
    createdAt: dbUser?.created_at || supabaseUser.created_at || new Date().toISOString(),
  };
}

/**
 * Standard Supabase Sign-Up with automatic profile row creation in public.users
 */
export async function supabaseSignUp(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: Role;
  badgeNumber?: string;
  department?: string;
}): Promise<{ user: User; token: string }> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        fullName: params.fullName,
        phone: params.phone || '',
        role: params.role,
        badgeNumber: params.badgeNumber || null,
        department: params.department || null,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Sign up failed. Please try again.');
  }

  // Ensure record in public.users table exists
  try {
    await supabase.from('users').upsert({
      id: authData.user.id,
      email: authData.user.email,
      full_name: params.fullName,
      phone: params.phone || null,
      role: params.role,
      badge_number: params.badgeNumber || null,
      department: params.department || null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('public.users upsert warning:', err);
  }

  const token = authData.session?.access_token || '';
  const mappedUser = mapSupabaseUserToTrinetraUser(authData.user);
  return { user: mappedUser, token };
}

/**
 * Supabase Sign-In with profile retrieval
 */
export async function supabaseSignIn(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user || !authData.session) {
    throw new Error('Sign in failed. Could not establish session.');
  }

  // Fetch role and details from public.users table if available
  let dbUser = null;
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!data) {
      // If user profile is not in public.users yet, create it from auth metadata
      const metadata = authData.user.user_metadata || {};
      const newProfile = {
        id: authData.user.id,
        email: authData.user.email,
        full_name: metadata.fullName || authData.user.email?.split('@')[0] || 'User',
        phone: metadata.phone || null,
        role: metadata.role || 'CITIZEN',
        badge_number: metadata.badgeNumber || null,
        department: metadata.department || null,
      };
      await supabase.from('users').upsert(newProfile);
      dbUser = newProfile;
    } else {
      dbUser = data;
    }
  } catch (err) {
    console.warn('Could not fetch from public.users table:', err);
  }

  const mappedUser = mapSupabaseUserToTrinetraUser(authData.user, dbUser);
  return { user: mappedUser, token: authData.session.access_token };
}

/**
 * Supabase Incident Report submission to public.incident_reports
 */
export async function supabaseSubmitIncidentReport(params: {
  disasterType: DisasterType;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  citizenName?: string;
  citizenPhone?: string;
  imageUrl?: string | null;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUser = sessionData?.session?.user;

  // Generate standardized TRINETRA tracking code e.g. RPT-2026-XXXX
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const trackingCode = `RPT-2026-${randomSuffix}`;

  // If user is authenticated, verify user profile exists in public.users to satisfy FK
  if (currentUser) {
    try {
      await supabase.from('users').upsert({
        id: currentUser.id,
        email: currentUser.email,
        full_name: params.citizenName || currentUser.user_metadata?.fullName || 'Verified Citizen',
        phone: params.citizenPhone || currentUser.user_metadata?.phone || null,
        role: currentUser.user_metadata?.role || 'CITIZEN',
      });
    } catch (e) {
      console.warn('User profile sync skipped:', e);
    }
  }

  const payload: any = {
    tracking_code: trackingCode,
    disaster_type: params.disasterType,
    title: params.title,
    description: params.description,
    location_name: params.locationName,
    latitude: params.latitude,
    longitude: params.longitude,
    citizen_name: params.citizenName || null,
    citizen_phone: params.citizenPhone || null,
    image_url: params.imageUrl || null,
    status: 'PENDING_VERIFICATION',
    triage_priority: 'MEDIUM',
  };

  if (currentUser) {
    payload.citizen_id = currentUser.id;
  }

  const { data, error } = await supabase
    .from('incident_reports')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    trackingCode: data.tracking_code,
    disasterType: data.disaster_type,
    locationName: data.location_name,
    createdAt: data.created_at,
  };
}

/**
 * Fetch incident reports from Supabase
 */
export async function supabaseGetIncidentReports() {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    trackingCode: row.tracking_code,
    disasterId: row.disaster_id,
    citizenId: row.citizen_id,
    citizenName: row.citizen_name,
    citizenPhone: row.citizen_phone,
    disasterType: row.disaster_type,
    title: row.title,
    description: row.description,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    imageUrl: row.image_url,
    status: row.status,
    triagePriority: row.triage_priority,
    authorityNotes: row.authority_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Fetch active disasters directly from Supabase
 */
export async function supabaseGetDisasters() {
  const { data, error } = await supabase
    .from('disasters')
    .select('*')
    .order('declared_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((d: any) => ({
    id: d.id,
    title: d.title,
    type: d.type,
    severity: d.severity,
    status: d.status,
    locationName: d.location_name,
    latitude: d.latitude,
    longitude: d.longitude,
    radiusKm: d.radius_km,
    description: d.description,
    affectedPopulationEst: d.affected_population_est,
    source: d.source,
    declaredAt: d.declared_at,
    containedAt: d.contained_at,
    updatedAt: d.updated_at,
  }));
}

/**
 * Create a new disaster directly in Supabase
 */
export async function supabaseCreateDisaster(params: {
  title: string;
  type: string;
  severity: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  description: string;
  affectedPopulationEst: number;
}) {
  const { data, error } = await supabase
    .from('disasters')
    .insert([
      {
        title: params.title,
        type: params.type,
        severity: params.severity,
        location_name: params.locationName,
        latitude: params.latitude,
        longitude: params.longitude,
        radius_km: params.radiusKm,
        description: params.description,
        affected_population_est: params.affectedPopulationEst,
        status: 'ACTIVE',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch alerts directly from Supabase
 */
export async function supabaseGetAlerts() {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('issued_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((a: any) => ({
    id: a.id,
    disasterId: a.disaster_id,
    authorId: a.author_id,
    title: a.title,
    type: a.type,
    severity: a.severity,
    status: a.status,
    targetAreaName: a.target_area_name,
    targetLatitude: a.target_latitude,
    targetLongitude: a.target_longitude,
    targetRadiusKm: a.target_radius_km,
    headline: a.headline,
    detailedMessage: a.detailed_message,
    actionInstructions: a.action_instructions,
    source: a.source,
    issuedAt: a.issued_at,
    expiresAt: a.expires_at,
    withdrawnAt: a.withdrawn_at,
    updatedAt: a.updated_at,
  }));
}

/**
 * Fetch all users from Supabase public.users
 */
export async function supabaseGetUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    phone: u.phone,
    role: u.role,
    badgeNumber: u.badge_number,
    department: u.department,
    createdAt: u.created_at,
  }));
}

/**
 * Admin: Create / Provision a new user in Supabase
 */
export async function supabaseAdminCreateUser(params: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string | null;
  department?: string | null;
  badgeNumber?: string | null;
}) {
  // Sign up using Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        fullName: params.fullName,
        phone: params.phone || '',
        role: params.role,
        department: params.department || '',
        badgeNumber: params.badgeNumber || '',
      },
    },
  });

  if (authError) throw new Error(authError.message);

  const userId = authData.user?.id || crypto.randomUUID();

  // Ensure record is saved in public.users
  const { data: dbData, error: dbError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: params.email,
      full_name: params.fullName,
      phone: params.phone || null,
      role: params.role,
      department: params.department || null,
      badge_number: params.badgeNumber || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) throw new Error(dbError.message);

  return {
    id: dbData.id,
    email: dbData.email,
    fullName: dbData.full_name,
    phone: dbData.phone,
    role: dbData.role,
    badgeNumber: dbData.badge_number,
    department: dbData.department,
    createdAt: dbData.created_at,
  };
}

/**
 * Admin: Delete a user from public.users
 */
export async function supabaseAdminDeleteUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Broadcast an emergency alert via Supabase
 */
export async function supabaseBroadcastAlert(params: {
  title: string;
  type: string;
  severity: string;
  targetAreaName: string;
  targetLatitude: number;
  targetLongitude: number;
  targetRadiusKm: number;
  headline: string;
  detailedMessage: string;
  actionInstructions: string;
  expiresAt: string;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const authorId = sessionData?.session?.user?.id || null;

  const { data, error } = await supabase
    .from('alerts')
    .insert([
      {
        title: params.title,
        type: params.type,
        severity: params.severity,
        target_area_name: params.targetAreaName,
        target_latitude: params.targetLatitude,
        target_longitude: params.targetLongitude,
        target_radius_km: params.targetRadiusKm,
        headline: params.headline,
        detailed_message: params.detailedMessage,
        action_instructions: params.actionInstructions,
        expires_at: params.expiresAt,
        author_id: authorId,
        status: 'ACTIVE',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    title: data.title,
    type: data.type,
    severity: data.severity,
    status: data.status,
    targetAreaName: data.target_area_name,
    targetLatitude: data.target_latitude,
    targetLongitude: data.target_longitude,
    targetRadiusKm: data.target_radius_km,
    headline: data.headline,
    detailedMessage: data.detailed_message,
    actionInstructions: data.action_instructions,
    source: data.source,
    issuedAt: data.issued_at,
    expiresAt: data.expires_at,
  };
}

/**
 * Fetch safe zones from Supabase
 */
export async function supabaseGetSafeZones() {
  const { data, error } = await supabase.from('safe_zones').select('*');
  if (error) throw new Error(error.message);

  return (data || []).map((sz: any) => ({
    id: sz.id,
    name: sz.name,
    type: sz.type,
    locationName: sz.location_name,
    latitude: sz.latitude,
    longitude: sz.longitude,
    capacityTotal: sz.capacity_total,
    capacityOccupied: sz.capacity_occupied,
    status: sz.status,
    amenities: sz.amenities,
    contactPerson: sz.contact_person,
    contactPhone: sz.contact_phone,
    elevationMeters: sz.elevation_meters,
    source: sz.source,
  }));
}

/**
 * Fetch emergency resources from Supabase
 */
export async function supabaseGetResources() {
  const { data, error } = await supabase.from('emergency_resources').select('*');
  if (error) throw new Error(error.message);

  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    locationName: r.location_name,
    latitude: r.latitude,
    longitude: r.longitude,
    contactNumber: r.contact_number,
    status: r.status,
    details: r.details,
    supplies: r.supplies,
    source: r.source,
  }));
}


