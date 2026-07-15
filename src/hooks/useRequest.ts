// ──────────────────────────────────────────────
//  BloodLink — useRequests hook (Supabase-backed)
//  - Fetches live data from Supabase on mount
//  - Subscribes to Realtime for instant cross-tab sync
//  - Escalation timer logic stays client-side (setTimeout)
// ──────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import type { BloodRequest, Donor, Hospital, BloodType } from '../types';
import type { DashboardStats } from '../types';
import { supabase } from '../lib/supabase';
import {
  fetchRequests,
  fetchStats,
  createRequest,
  respondToDonor as dbRespondToDonor,
  cancelRequest  as dbCancelRequest,
  escalateRequest as dbEscalateRequest,
  getTierDonors,
  fetchDonors,
  fetchHospitals,
  createDonor as dbCreateDonor,
  createHospital as dbCreateHospital,
} from '../lib/db';

// Re-export createRequest so NewRequestPage can import from the same place it did before
export { createRequest };

// ── State transition map ─────────────────────────────────────
const STATE_TRANSITIONS: Record<BloodRequest['state'], BloodRequest['state'] | null> = {
  pending:        'tier1_notified',
  tier1_notified: 'tier2_notified',
  tier2_notified: 'matched',
  matched:        null,
  expired:        null,
  cancelled:      null,
};

// ── Hook return type ─────────────────────────────────────────
interface UseRequestReturn {
  requests:     BloodRequest[];
  stats:        DashboardStats;
  donors:       Donor[];
  hospitals:    Hospital[];
  loading:      boolean;
  error:        string | null;
  getRequest:   (id: string) => BloodRequest | undefined;
  addRequest:   (req: BloodRequest) => void;
  respondToDonor:  (requestId: string, donorId: string, accepted: boolean) => Promise<void>;
  cancelRequest:   (requestId: string) => Promise<void>;
  addDonor:     (params: { name: string; bloodType: BloodType; phone: string; city: string; distanceKm: number; tier: 1 | 2 }) => Promise<Donor>;
  addHospital:  (params: { name: string; address: string; city: string; lat: number; lng: number }) => Promise<Hospital>;
}


export function useRequests(): UseRequestReturn {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [stats,    setStats]    = useState<DashboardStats>({
    activeRequests: 0, donorsAvailable: 0, matchedToday: 0, avgResponseTimeMin: 8,
  });
  const [donors, setDonors] = useState<Donor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Initial data load ──────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [reqs, st, dns, hosps] = await Promise.all([
        fetchRequests(),
        fetchStats(),
        fetchDonors(),
        fetchHospitals(),
      ]);
      setRequests(reqs);
      setStats(st);
      setDonors(dns);
      setHospitals(hosps);
      setError(null);
    } catch (err: any) {
      console.error('Supabase connection error:', err);
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError(msg || 'Failed to load data from Supabase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Supabase Realtime subscription ────────────────────────
  // Whenever blood_requests, notified_donors, donors, or hospitals change in DB,
  // reload the full state so all open tabs stay in sync.
  useEffect(() => {
    const channel = supabase
      .channel('bloodlink-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_requests' },
        () => { loadAll(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notified_donors' },
        () => { loadAll(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donors' },
        () => { loadAll(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospitals' },
        () => { loadAll(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadAll]);


  // ── Client-side escalation engine ─────────────────────────
  const escalateRequest = useCallback(async (requestId: string) => {
    setRequests(prev => {
      const req = prev.find(r => r.id === requestId);
      if (!req) return prev;
      if (req.state === 'matched' || req.state === 'expired' || req.state === 'cancelled') return prev;

      const nextState = STATE_TRANSITIONS[req.state];
      if (!nextState) {
        // No more transitions → expire
        dbEscalateRequest(requestId, 'expired', []).catch(console.error);
        return prev.map(r => r.id === requestId
          ? { ...r, state: 'expired' as const, updatedAt: new Date().toISOString() }
          : r
        );
      }

      // Determine new donors to add
      const tierToAdd: 1 | 2 | null =
        nextState === 'tier1_notified' ? 1 :
        nextState === 'tier2_notified' ? 2 : null;

      if (tierToAdd !== null) {
        getTierDonors(req.bloodType, tierToAdd).then(tierDonors => {
          const slice = tierDonors.slice(0, 2);
          const donorRefs = slice.map(d => ({ donorId: d.id, tier: tierToAdd }));
          dbEscalateRequest(requestId, nextState, donorRefs).catch(console.error);
          // Optimistic local update
          setRequests(cur => cur.map(r => r.id === requestId ? {
            ...r,
            state:           nextState,
            notifiedDonors:  [...r.notifiedDonors, ...slice],
            tierEscalatedAt: new Date().toISOString(),
            updatedAt:       new Date().toISOString(),
          } : r));
        }).catch(console.error);
      } else {
        dbEscalateRequest(requestId, nextState, []).catch(console.error);
        return prev.map(r => r.id === requestId ? {
          ...r,
          state:           nextState,
          tierEscalatedAt: new Date().toISOString(),
          updatedAt:       new Date().toISOString(),
        } : r);
      }

      return prev; // optimistic update handled in async branch above
    });
  }, []);

  // ── Schedule escalation for a request ─────────────────────
  const scheduleEscalation = useCallback((req: BloodRequest) => {
    if (req.state === 'matched' || req.state === 'expired' || req.state === 'cancelled') return;
    const existing = timersRef.current.get(req.id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      escalateRequest(req.id);
      timersRef.current.delete(req.id);
    }, req.escalationTimerMs);

    timersRef.current.set(req.id, timer);
  }, [escalateRequest]);

  // ── Schedule escalations whenever requests list changes ───
  useEffect(() => {
    requests.forEach(req => {
      const terminal = req.state === 'matched' || req.state === 'expired' || req.state === 'cancelled';
      if (!terminal && !timersRef.current.has(req.id)) {
        scheduleEscalation(req);
      }
    });
  }, [requests, scheduleEscalation]);

  // ── Cleanup timers on unmount ──────────────────────────────
  useEffect(() => {
    const timers = timersRef.current;
    return () => { timers.forEach(t => clearTimeout(t)); };
  }, []);

  // ── Update stats whenever requests change ─────────────────
  useEffect(() => {
    const activeStates: BloodRequest['state'][] = ['pending', 'tier1_notified', 'tier2_notified'];
    const active  = requests.filter(r => activeStates.includes(r.state)).length;
    const matched = requests.filter(r => r.state === 'matched').length;
    setStats(s => ({ ...s, activeRequests: active, matchedToday: matched }));
  }, [requests]);

  // ── Public API ─────────────────────────────────────────────

  const getRequest = useCallback(
    (id: string) => requests.find(r => r.id === id),
    [requests]
  );

  // addRequest: called by NewRequestPage after createRequest() resolves.
  // The Realtime subscription will reload, but we also optimistically add it.
  const addRequest = useCallback((req: BloodRequest) => {
    setRequests(prev => [req, ...prev]);
    scheduleEscalation(req);
  }, [scheduleEscalation]);

  const respondToDonor = useCallback(async (
    requestId: string,
    donorId:   string,
    accepted:  boolean
  ) => {
    // Optimistic update
    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      const updatedDonors = req.notifiedDonors.map(d =>
        d.id === donorId
          ? { ...d, responseStatus: (accepted ? 'accepted' : 'declined') as Donor['responseStatus'], respondedAt: new Date().toISOString() }
          : d
      );
      const acceptedDonor = updatedDonors.find(d => d.id === donorId && accepted);
      if (accepted && acceptedDonor) {
        const timer = timersRef.current.get(requestId);
        if (timer) { clearTimeout(timer); timersRef.current.delete(requestId); }
        return { ...req, state: 'matched' as const, matchedDonor: acceptedDonor, notifiedDonors: updatedDonors, updatedAt: new Date().toISOString() };
      }
      return { ...req, notifiedDonors: updatedDonors, updatedAt: new Date().toISOString() };
    }));

    // Persist to DB (Realtime will trigger a full reload to confirm)
    await dbRespondToDonor(requestId, donorId, accepted);
  }, []);

  const cancelRequest = useCallback(async (requestId: string) => {
    const timer = timersRef.current.get(requestId);
    if (timer) { clearTimeout(timer); timersRef.current.delete(requestId); }

    // Optimistic update
    setRequests(prev => prev.map(req =>
      req.id === requestId
        ? { ...req, state: 'cancelled' as const, updatedAt: new Date().toISOString() }
        : req
    ));

    await dbCancelRequest(requestId);
  }, []);

  const addDonor = useCallback(async (params: {
    name: string;
    bloodType: BloodType;
    phone: string;
    city: string;
    distanceKm: number;
    tier: 1 | 2;
  }) => {
    const newDonor = await dbCreateDonor(params);
    setDonors(prev => [...prev, newDonor]);
    const st = await fetchStats();
    setStats(st);
    return newDonor;
  }, []);

  const addHospital = useCallback(async (params: {
    name: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
  }) => {
    const newHosp = await dbCreateHospital(params);
    setHospitals(prev => [...prev, newHosp]);
    return newHosp;
  }, []);

  return {
    requests,
    stats,
    donors,
    hospitals,
    loading,
    error,
    getRequest,
    addRequest,
    respondToDonor,
    cancelRequest,
    addDonor,
    addHospital,
  };
}

