-- ============================================================
--  BloodLink — Supabase Schema
--  Run this once in the Supabase SQL Editor (Database > SQL Editor)
--  Then run seed.sql to populate initial data.
-- ============================================================

-- ── Enum-like check constraints ──────────────────────────────
-- (Postgres CHECK constraints used instead of enums for easier migrations)

-- ── 1. Hospitals ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Donors ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donors (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  blood_type      TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone           TEXT NOT NULL,
  city            TEXT NOT NULL,
  distance_km     DOUBLE PRECISION NOT NULL DEFAULT 0,
  tier            INTEGER NOT NULL CHECK (tier IN (1, 2)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Blood Requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blood_requests (
  id                    TEXT PRIMARY KEY,
  hospital_id           TEXT NOT NULL REFERENCES hospitals(id),
  hospital_name         TEXT NOT NULL,
  blood_type            TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  urgency               TEXT NOT NULL CHECK (urgency IN ('critical','urgent','standard')),
  units_needed          INTEGER NOT NULL DEFAULT 1 CHECK (units_needed >= 1),
  patient_condition     TEXT NOT NULL,
  location              TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT 'pending'
                          CHECK (state IN ('pending','tier1_notified','tier2_notified','matched','expired','cancelled')),
  escalation_timer_ms   INTEGER NOT NULL DEFAULT 30000,
  tier_escalated_at     TIMESTAMPTZ,
  matched_donor_id      TEXT REFERENCES donors(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blood_requests_updated_at ON blood_requests;
CREATE TRIGGER trg_blood_requests_updated_at
  BEFORE UPDATE ON blood_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4. Notified Donors (junction) ────────────────────────────
CREATE TABLE IF NOT EXISTS notified_donors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      TEXT NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id        TEXT NOT NULL REFERENCES donors(id),
  response_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (response_status IN ('pending','accepted','declined')),
  tier            INTEGER NOT NULL CHECK (tier IN (1, 2)),
  notified_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at    TIMESTAMPTZ
);

-- Index for fast lookups by request
CREATE INDEX IF NOT EXISTS idx_notified_donors_request_id ON notified_donors(request_id);

-- ── Row Level Security ────────────────────────────────────────
-- RLS is disabled for this demo app (no auth layer yet).
-- Enable and add policies when auth is introduced.
ALTER TABLE hospitals        DISABLE ROW LEVEL SECURITY;
ALTER TABLE donors           DISABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests   DISABLE ROW LEVEL SECURITY;
ALTER TABLE notified_donors  DISABLE ROW LEVEL SECURITY;

-- ── Realtime ─────────────────────────────────────────────────
-- Enable Realtime publication for the tables the UI subscribes to.
-- Run these only once; they are idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE blood_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notified_donors;
