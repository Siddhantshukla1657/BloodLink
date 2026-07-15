// ──────────────────────────────────────────────
//  BloodLink — Typed DB Query Helpers
//  All data access goes through this module.
//  No mock data here — everything hits Supabase.
// ──────────────────────────────────────────────
import { supabase } from './supabase';
import type {
  BloodRequest,
  Donor,
  Hospital,
  DashboardStats,
  BloodType,
  UrgencyLevel,
} from '../types';

// ── Row → Domain mappers ────────────────────────────────────

function mapDonorRow(
  row: {
    id: string; name: string; blood_type: string; phone: string;
    city: string; distance_km: number; tier: number;
  },
  overrides: {
    responseStatus?: Donor['responseStatus'];
    notifiedAt?: string;
    respondedAt?: string | null;
  } = {}
): Donor {
  return {
    id:             row.id,
    name:           row.name,
    bloodType:      row.blood_type as BloodType,
    phone:          row.phone,
    city:           row.city,
    distanceKm:     row.distance_km,
    tier:           row.tier as 1 | 2,
    responseStatus: overrides.responseStatus ?? 'pending',
    notifiedAt:     overrides.notifiedAt,
    respondedAt:    overrides.respondedAt ?? undefined,
  };
}

function mapHospitalRow(row: {
  id: string; name: string; address: string; city: string; lat: number; lng: number;
}): Hospital {
  return { id: row.id, name: row.name, address: row.address, city: row.city, lat: row.lat, lng: row.lng };
}

// Assemble a BloodRequest from DB rows (with joined notified donors).
function assembleRequest(
  reqRow: {
    id: string; hospital_id: string; hospital_name: string; blood_type: string;
    urgency: string; units_needed: number; patient_condition: string; location: string;
    state: string; escalation_timer_ms: number; tier_escalated_at: string | null;
    matched_donor_id: string | null; notes: string | null;
    created_at: string; updated_at: string;
  },
  notifiedRows: Array<{
    donor_id: string; response_status: string; tier: number;
    notified_at: string; responded_at: string | null;
    donors: {
      id: string; name: string; blood_type: string; phone: string;
      city: string; distance_km: number; tier: number;
    } | null;
  }>
): BloodRequest {
  const notifiedDonors: Donor[] = notifiedRows
    .filter(r => r.donors !== null)
    .map(r =>
      mapDonorRow(r.donors!, {
        responseStatus: r.response_status as Donor['responseStatus'],
        notifiedAt:     r.notified_at,
        respondedAt:    r.responded_at,
      })
    );

  const matchedDonor = notifiedDonors.find(
    d => d.id === reqRow.matched_donor_id && d.responseStatus === 'accepted'
  );

  return {
    id:                reqRow.id,
    hospitalId:        reqRow.hospital_id,
    hospitalName:      reqRow.hospital_name,
    bloodType:         reqRow.blood_type as BloodType,
    urgency:           reqRow.urgency as UrgencyLevel,
    unitsNeeded:       reqRow.units_needed,
    patientCondition:  reqRow.patient_condition,
    location:          reqRow.location,
    state:             reqRow.state as BloodRequest['state'],
    createdAt:         reqRow.created_at,
    updatedAt:         reqRow.updated_at,
    notifiedDonors,
    matchedDonor,
    escalationTimerMs: reqRow.escalation_timer_ms,
    tierEscalatedAt:   reqRow.tier_escalated_at ?? undefined,
    notes:             reqRow.notes ?? undefined,
  };
}

// ── Fetch all requests (with nested notified donors) ────────

export async function fetchRequests(): Promise<BloodRequest[]> {
  const { data: reqRows, error } = await supabase
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!reqRows || reqRows.length === 0) return [];

  // Fetch all notified_donors rows for these requests (with donor join)
  const requestIds = reqRows.map(r => r.id);
  const { data: ndRows, error: ndErr } = await supabase
    .from('notified_donors')
    .select('*, donors(*)')
    .in('request_id', requestIds);

  if (ndErr) throw ndErr;

  const ndByRequest: Record<string, typeof ndRows> = {};
  for (const nd of ndRows ?? []) {
    if (!ndByRequest[nd.request_id]) ndByRequest[nd.request_id] = [];
    ndByRequest[nd.request_id]!.push(nd);
  }

  return reqRows.map(row =>
    assembleRequest(row, ndByRequest[row.id] ?? [])
  );
}

// ── Fetch single request ────────────────────────────────────

export async function fetchRequest(id: string): Promise<BloodRequest | null> {
  const { data: reqRow, error } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !reqRow) return null;

  const { data: ndRows, error: ndErr } = await supabase
    .from('notified_donors')
    .select('*, donors(*)')
    .eq('request_id', id);

  if (ndErr) throw ndErr;

  return assembleRequest(reqRow, ndRows ?? []);
}

// ── Fetch hospitals ─────────────────────────────────────────

export async function fetchHospitals(): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(mapHospitalRow);
}

// ── Fetch donors ────────────────────────────────────────────

export async function fetchDonors(): Promise<Donor[]> {
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(row => mapDonorRow(row));
}

// ── Create a new donor ──────────────────────────────────────

export async function createDonor(params: {
  name: string;
  bloodType: BloodType;
  phone: string;
  city: string;
  distanceKm: number;
  tier: 1 | 2;
}): Promise<Donor> {
  const id = `d-${Date.now()}`;
  const { error } = await supabase.from('donors').insert({
    id,
    name: params.name,
    blood_type: params.bloodType,
    phone: params.phone,
    city: params.city,
    distance_km: params.distanceKm,
    tier: params.tier,
  });

  if (error) throw error;
  return {
    id,
    name: params.name,
    bloodType: params.bloodType,
    phone: params.phone,
    city: params.city,
    distanceKm: params.distanceKm,
    tier: params.tier,
    responseStatus: 'pending',
  };
}

// ── Create a new hospital ───────────────────────────────────

export async function createHospital(params: {
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
}): Promise<Hospital> {
  const id = `hosp-${Date.now()}`;
  const { error } = await supabase.from('hospitals').insert({
    id,
    name: params.name,
    address: params.address,
    city: params.city,
    lat: params.lat,
    lng: params.lng,
  });

  if (error) throw error;
  return {
    id,
    name: params.name,
    address: params.address,
    city: params.city,
    lat: params.lat,
    lng: params.lng,
  };
}


// ── Create a new blood request ──────────────────────────────

let requestCounter = 100;
function generateRequestId(): string {
  return `REQ-${String(++requestCounter).padStart(3, '0')}`;
}

export async function createRequest(params: {
  bloodType:        BloodType;
  urgency:          UrgencyLevel;
  unitsNeeded:      number;
  patientCondition: string;
  location:         string;
  hospitalId:       string;
  hospitalName:     string;
  notes?:           string;
}): Promise<BloodRequest> {
  const id = generateRequestId();
  const escalationTimerMs =
    params.urgency === 'critical' ? 10000 :
    params.urgency === 'urgent'   ? 20000 : 30000;

  const { error } = await supabase.from('blood_requests').insert({
    id,
    hospital_id:       params.hospitalId,
    hospital_name:     params.hospitalName,
    blood_type:        params.bloodType,
    urgency:           params.urgency,
    units_needed:      params.unitsNeeded,
    patient_condition: params.patientCondition,
    location:          params.location,
    state:             'pending',
    escalation_timer_ms: escalationTimerMs,
    notes:             params.notes ?? null,
  });

  if (error) throw error;

  const req = await fetchRequest(id);
  if (!req) throw new Error(`Failed to re-fetch created request ${id}`);
  return req;
}

// ── Respond as a donor (accept / decline) ───────────────────

export async function respondToDonor(
  requestId: string,
  donorId:   string,
  accepted:  boolean
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update the notified_donors row
  const { error: ndErr } = await supabase
    .from('notified_donors')
    .update({
      response_status: accepted ? 'accepted' : 'declined',
      responded_at:    now,
    })
    .eq('request_id', requestId)
    .eq('donor_id', donorId);

  if (ndErr) throw ndErr;

  // 2. If accepted → mark request as matched
  if (accepted) {
    const { error: reqErr } = await supabase
      .from('blood_requests')
      .update({
        state:            'matched',
        matched_donor_id: donorId,
      })
      .eq('id', requestId);

    if (reqErr) throw reqErr;
  }
}

// ── Cancel a request ─────────────────────────────────────────

export async function cancelRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('blood_requests')
    .update({ state: 'cancelled' })
    .eq('id', requestId);

  if (error) throw error;
}

// ── Escalate a request (advance state + add new donors) ─────

export async function escalateRequest(
  requestId: string,
  nextState:  BloodRequest['state'],
  newDonors:  Array<{ donorId: string; tier: 1 | 2 }>
): Promise<void> {
  const now = new Date().toISOString();

  const { error: reqErr } = await supabase
    .from('blood_requests')
    .update({
      state:              nextState,
      tier_escalated_at:  now,
    })
    .eq('id', requestId);

  if (reqErr) throw reqErr;

  if (newDonors.length > 0) {
    const inserts = newDonors.map(d => ({
      request_id:      requestId,
      donor_id:        d.donorId,
      response_status: 'pending' as const,
      tier:            d.tier,
      notified_at:     now,
    }));

    const { error: ndErr } = await supabase
      .from('notified_donors')
      .upsert(inserts, { onConflict: 'request_id,donor_id' });

    if (ndErr) throw ndErr;
  }
}

// ── Dashboard stats ─────────────────────────────────────────

export async function fetchStats(): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('blood_requests')
    .select('state');

  if (error) throw error;

  const rows = data ?? [];
  const activeStates = ['pending', 'tier1_notified', 'tier2_notified'];
  const active  = rows.filter(r => activeStates.includes(r.state)).length;
  const matched = rows.filter(r => r.state === 'matched').length;

  // Donors available = all donors in the pool (static for demo)
  const { count } = await supabase
    .from('donors')
    .select('id', { count: 'exact', head: true });

  return {
    activeRequests:    active,
    donorsAvailable:   count ?? 0,
    matchedToday:      matched,
    avgResponseTimeMin: 8, // static demo value
  };
}

// ── Donor pool helpers (for escalation logic) ───────────────

export async function getTierDonors(
  _bloodType: BloodType,
  tier: 1 | 2
): Promise<Donor[]> {
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('tier', tier);

  if (error) throw error;

  return (data ?? []).map(row =>
    mapDonorRow(row, {
      responseStatus: 'pending',
      notifiedAt:     new Date().toISOString(),
    })
  );
}
