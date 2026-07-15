// ──────────────────────────────────────────────
//  BloodLink — Core TypeScript Types
// ──────────────────────────────────────────────

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'critical' | 'urgent' | 'standard';

export type RequestState =
  | 'pending'
  | 'tier1_notified'
  | 'tier2_notified'
  | 'matched'
  | 'expired'
  | 'cancelled';

export type DonorResponseStatus = 'pending' | 'accepted' | 'declined';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
}

export interface Donor {
  id: string;
  name: string;
  bloodType: BloodType;
  phone: string;
  city: string;
  distanceKm: number;
  tier: 1 | 2;
  responseStatus: DonorResponseStatus;
  notifiedAt?: string; // ISO timestamp — SIMULATED
  respondedAt?: string;
}

export interface BloodRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: BloodType;
  urgency: UrgencyLevel;
  unitsNeeded: number;
  patientCondition: string;
  location: string;
  state: RequestState;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  notifiedDonors: Donor[];
  matchedDonor?: Donor;
  escalationTimerMs: number; // ms until next tier escalation
  tierEscalatedAt?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  message: string;
  sentAt: string; // ISO timestamp — SIMULATED
  channel: 'SMS' | 'Push' | 'Email';
  isSimulated: true;
}

export interface DashboardStats {
  activeRequests: number;
  donorsAvailable: number;
  matchedToday: number;
  avgResponseTimeMin: number;
}
