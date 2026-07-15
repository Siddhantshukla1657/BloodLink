// ──────────────────────────────────────────────
//  BloodLink — Mock Data & State Machine
// ──────────────────────────────────────────────
import type { BloodRequest, Donor, Hospital, DashboardStats, BloodType } from '../types';

// ---- Seed Hospitals ----
export const HOSPITALS: Hospital[] = [
  { id: 'hosp-1', name: 'City General Hospital', address: '14 Rajpur Road', city: 'Delhi', lat: 28.6517, lng: 77.2219 },
  { id: 'hosp-2', name: 'Apollo Hospitals', address: 'Sarita Vihar', city: 'Delhi', lat: 28.5355, lng: 77.2900 },
  { id: 'hosp-3', name: 'AIIMS New Delhi', address: 'Ansari Nagar', city: 'Delhi', lat: 28.5672, lng: 77.2100 },
];

// ---- Seed Donors Pool ----
const makeDonor = (
  id: string, name: string, bloodType: BloodType, city: string,
  distKm: number, tier: 1 | 2, status: 'pending' | 'accepted' | 'declined' = 'pending'
): Donor => ({
  id, name, bloodType, phone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
  city, distanceKm: distKm, tier, responseStatus: status,
});

export const DONORS_POOL: Donor[] = [
  makeDonor('d1',  'Arjun Mehta',       'O-',  'Delhi',   1.2, 1),
  makeDonor('d2',  'Priya Sharma',      'O-',  'Delhi',   2.5, 1),
  makeDonor('d3',  'Rahul Singh',       'A+',  'Delhi',   3.1, 1),
  makeDonor('d4',  'Anjali Patel',      'B+',  'Delhi',   4.0, 1),
  makeDonor('d5',  'Karan Gupta',       'AB+', 'Delhi',   4.8, 1),
  makeDonor('d6',  'Sneha Rao',         'O+',  'Delhi',   5.2, 1),
  makeDonor('d7',  'Vikram Nair',       'A-',  'Noida',   8.3, 2),
  makeDonor('d8',  'Deepa Krishnan',    'B-',  'Noida',   9.1, 2),
  makeDonor('d9',  'Mohit Agarwal',     'AB-', 'Gurugram', 12.0, 2),
  makeDonor('d10', 'Ritika Joshi',      'O-',  'Gurugram', 14.5, 2),
];

// ---- Initial Mock Requests ----
const now = () => new Date().toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

let requestCounter = 100;
export const generateRequestId = () => `REQ-${++requestCounter}`;

export function createMockRequest(
  bloodType: BloodType,
  urgency: BloodRequest['urgency'],
  units: number,
  patientCondition: string,
  location: string,
  hospitalId: string,
  notes?: string
): BloodRequest {
  const hospital = HOSPITALS.find(h => h.id === hospitalId) || HOSPITALS[0];
  const id = generateRequestId();
  const donors = DONORS_POOL
    .filter(d => d.bloodType === bloodType || (bloodType === 'AB+' ? true : false))
    .slice(0, 4)
    .map(d => ({ ...d, responseStatus: 'pending' as const }));

  // If no compatible donors, take closest ones
  const notifiedDonors = donors.length > 0
    ? donors
    : DONORS_POOL.slice(0, 3).map(d => ({ ...d, responseStatus: 'pending' as const }));

  return {
    id,
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    bloodType,
    urgency,
    unitsNeeded: units,
    patientCondition,
    location,
    state: 'pending',
    createdAt: now(),
    updatedAt: now(),
    notifiedDonors,
    escalationTimerMs: urgency === 'critical' ? 10000 : urgency === 'urgent' ? 20000 : 30000,
    notes,
  };
}

// ---- Seeded Requests (initial state) ----
export const INITIAL_REQUESTS: BloodRequest[] = [
  {
    id: 'REQ-001',
    hospitalId: 'hosp-1',
    hospitalName: 'City General Hospital',
    bloodType: 'O-',
    urgency: 'critical',
    unitsNeeded: 3,
    patientCondition: 'Emergency surgery — severe internal bleeding',
    location: 'OT Block 3, City General Hospital',
    state: 'tier1_notified',
    createdAt: minutesAgo(8),
    updatedAt: minutesAgo(3),
    notifiedDonors: [
      { ...DONORS_POOL[0], responseStatus: 'pending',  notifiedAt: minutesAgo(3) },
      { ...DONORS_POOL[1], responseStatus: 'declined', notifiedAt: minutesAgo(3), respondedAt: minutesAgo(1) },
    ],
    escalationTimerMs: 10000,
    tierEscalatedAt: minutesAgo(3),
    notes: 'Patient in critical condition. Any O- or O+ donor acceptable.',
  },
  {
    id: 'REQ-002',
    hospitalId: 'hosp-2',
    hospitalName: 'Apollo Hospitals',
    bloodType: 'AB+',
    urgency: 'urgent',
    unitsNeeded: 2,
    patientCondition: 'Post-operative transfusion required',
    location: 'ICU Ward 5, Apollo Hospitals',
    state: 'matched',
    createdAt: minutesAgo(45),
    updatedAt: minutesAgo(12),
    notifiedDonors: [
      { ...DONORS_POOL[4], responseStatus: 'accepted', notifiedAt: minutesAgo(40), respondedAt: minutesAgo(12) },
      { ...DONORS_POOL[3], responseStatus: 'declined', notifiedAt: minutesAgo(40), respondedAt: minutesAgo(30) },
    ],
    matchedDonor: { ...DONORS_POOL[4], responseStatus: 'accepted' },
    escalationTimerMs: 20000,
    tierEscalatedAt: minutesAgo(40),
  },
  {
    id: 'REQ-003',
    hospitalId: 'hosp-3',
    hospitalName: 'AIIMS New Delhi',
    bloodType: 'B+',
    urgency: 'standard',
    unitsNeeded: 1,
    patientCondition: 'Scheduled bone marrow transplant prep',
    location: 'Haematology Dept, AIIMS',
    state: 'pending',
    createdAt: minutesAgo(2),
    updatedAt: minutesAgo(2),
    notifiedDonors: [],
    escalationTimerMs: 30000,
  },
  {
    id: 'REQ-004',
    hospitalId: 'hosp-1',
    hospitalName: 'City General Hospital',
    bloodType: 'A-',
    urgency: 'urgent',
    unitsNeeded: 2,
    patientCondition: 'Road accident victim, trauma unit',
    location: 'Trauma Bay 1, City General',
    state: 'tier2_notified',
    createdAt: minutesAgo(25),
    updatedAt: minutesAgo(5),
    notifiedDonors: [
      { ...DONORS_POOL[6], responseStatus: 'pending', notifiedAt: minutesAgo(5) },
      { ...DONORS_POOL[7], responseStatus: 'pending', notifiedAt: minutesAgo(5) },
    ],
    escalationTimerMs: 20000,
    tierEscalatedAt: minutesAgo(5),
  },
];

// ---- Dashboard Stats ----
export const DASHBOARD_STATS: DashboardStats = {
  activeRequests: 3,
  donorsAvailable: 47,
  matchedToday: 12,
  avgResponseTimeMin: 8,
};

// ---- State transition helpers ----
export const STATE_TRANSITIONS: Record<BloodRequest['state'], BloodRequest['state'] | null> = {
  pending:         'tier1_notified',
  tier1_notified:  'tier2_notified',
  tier2_notified:  'matched',
  matched:         null,
  expired:         null,
  cancelled:       null,
};

export function getNextState(current: BloodRequest['state']): BloodRequest['state'] | null {
  return STATE_TRANSITIONS[current];
}

// ---- Tier donors for escalation ----
export function getTierDonors(_bloodType: BloodType, tier: 1 | 2): Donor[] {
  return DONORS_POOL
    .filter(d => d.tier === tier)
    .map(d => ({ ...d, responseStatus: 'pending' as const, notifiedAt: new Date().toISOString() }));
}
