-- ============================================================
--  BloodLink — Seed Data
--  Run AFTER schema.sql in the Supabase SQL Editor.
--  Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING).
-- ============================================================

-- ── Hospitals ────────────────────────────────────────────────
INSERT INTO hospitals (id, name, address, city, lat, lng) VALUES
  ('hosp-1', 'City General Hospital', '14 Rajpur Road',   'Delhi',  28.6517, 77.2219),
  ('hosp-2', 'Apollo Hospitals',      'Sarita Vihar',     'Delhi',  28.5355, 77.2900),
  ('hosp-3', 'AIIMS New Delhi',       'Ansari Nagar',     'Delhi',  28.5672, 77.2100)
ON CONFLICT (id) DO NOTHING;

-- ── Donors ───────────────────────────────────────────────────
INSERT INTO donors (id, name, blood_type, phone, city, distance_km, tier) VALUES
  ('d1',  'Arjun Mehta',    'O-',  '+91 9812345678', 'Delhi',    1.2,  1),
  ('d2',  'Priya Sharma',   'O-',  '+91 9823456789', 'Delhi',    2.5,  1),
  ('d3',  'Rahul Singh',    'A+',  '+91 9834567890', 'Delhi',    3.1,  1),
  ('d4',  'Anjali Patel',   'B+',  '+91 9845678901', 'Delhi',    4.0,  1),
  ('d5',  'Karan Gupta',    'AB+', '+91 9856789012', 'Delhi',    4.8,  1),
  ('d6',  'Sneha Rao',      'O+',  '+91 9867890123', 'Delhi',    5.2,  1),
  ('d7',  'Vikram Nair',    'A-',  '+91 9878901234', 'Noida',    8.3,  2),
  ('d8',  'Deepa Krishnan', 'B-',  '+91 9889012345', 'Noida',    9.1,  2),
  ('d9',  'Mohit Agarwal',  'AB-', '+91 9890123456', 'Gurugram', 12.0, 2),
  ('d10', 'Ritika Joshi',   'O-',  '+91 9801234567', 'Gurugram', 14.5, 2)
ON CONFLICT (id) DO NOTHING;

-- ── Initial Blood Requests ───────────────────────────────────
-- REQ-001: critical, tier1_notified, 8 mins old
INSERT INTO blood_requests
  (id, hospital_id, hospital_name, blood_type, urgency, units_needed,
   patient_condition, location, state, escalation_timer_ms, tier_escalated_at,
   created_at, updated_at)
VALUES (
  'REQ-001', 'hosp-1', 'City General Hospital', 'O-', 'critical', 3,
  'Emergency surgery — severe internal bleeding',
  'OT Block 3, City General Hospital',
  'tier1_notified', 10000,
  NOW() - INTERVAL '3 minutes',
  NOW() - INTERVAL '8 minutes',
  NOW() - INTERVAL '3 minutes'
) ON CONFLICT (id) DO NOTHING;

-- REQ-002: urgent, matched
INSERT INTO blood_requests
  (id, hospital_id, hospital_name, blood_type, urgency, units_needed,
   patient_condition, location, state, escalation_timer_ms, tier_escalated_at,
   matched_donor_id, created_at, updated_at)
VALUES (
  'REQ-002', 'hosp-2', 'Apollo Hospitals', 'AB+', 'urgent', 2,
  'Post-operative transfusion required',
  'ICU Ward 5, Apollo Hospitals',
  'matched', 20000,
  NOW() - INTERVAL '40 minutes',
  'd5',
  NOW() - INTERVAL '45 minutes',
  NOW() - INTERVAL '12 minutes'
) ON CONFLICT (id) DO NOTHING;

-- REQ-003: standard, pending
INSERT INTO blood_requests
  (id, hospital_id, hospital_name, blood_type, urgency, units_needed,
   patient_condition, location, state, escalation_timer_ms,
   created_at, updated_at)
VALUES (
  'REQ-003', 'hosp-3', 'AIIMS New Delhi', 'B+', 'standard', 1,
  'Scheduled bone marrow transplant prep',
  'Haematology Dept, AIIMS',
  'pending', 30000,
  NOW() - INTERVAL '2 minutes',
  NOW() - INTERVAL '2 minutes'
) ON CONFLICT (id) DO NOTHING;

-- REQ-004: urgent, tier2_notified
INSERT INTO blood_requests
  (id, hospital_id, hospital_name, blood_type, urgency, units_needed,
   patient_condition, location, state, escalation_timer_ms, tier_escalated_at,
   created_at, updated_at)
VALUES (
  'REQ-004', 'hosp-1', 'City General Hospital', 'A-', 'urgent', 2,
  'Road accident victim, trauma unit',
  'Trauma Bay 1, City General',
  'tier2_notified', 20000,
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '25 minutes',
  NOW() - INTERVAL '5 minutes'
) ON CONFLICT (id) DO NOTHING;

-- ── Notified Donors ──────────────────────────────────────────
-- REQ-001 tier1 donors
INSERT INTO notified_donors (request_id, donor_id, response_status, tier, notified_at) VALUES
  ('REQ-001', 'd1', 'pending',  1, NOW() - INTERVAL '3 minutes'),
  ('REQ-001', 'd2', 'declined', 1, NOW() - INTERVAL '3 minutes')
ON CONFLICT DO NOTHING;

UPDATE notified_donors SET responded_at = NOW() - INTERVAL '1 minute'
WHERE request_id = 'REQ-001' AND donor_id = 'd2';

-- REQ-002 donors (matched)
INSERT INTO notified_donors (request_id, donor_id, response_status, tier, notified_at, responded_at) VALUES
  ('REQ-002', 'd5', 'accepted', 1, NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '12 minutes'),
  ('REQ-002', 'd4', 'declined', 1, NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- REQ-004 tier2 donors
INSERT INTO notified_donors (request_id, donor_id, response_status, tier, notified_at) VALUES
  ('REQ-004', 'd7', 'pending', 2, NOW() - INTERVAL '5 minutes'),
  ('REQ-004', 'd8', 'pending', 2, NOW() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;
