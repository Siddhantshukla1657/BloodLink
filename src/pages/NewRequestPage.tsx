// ──────────────────────────────────────────────
//  BloodLink — New Request Page (Supabase-backed)
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BloodTypeBadge } from '../components/ui/BloodTypeBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { BloodType, BloodRequest, Hospital } from '../types';
import { fetchHospitals, createRequest } from '../lib/db';
import { SirenIcon, WarningIcon, ClipboardIcon } from '../components/ui/Icons';
import './NewRequestPage.css';

const BLOOD_TYPES: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

interface Props {
  onAddRequest: (req: BloodRequest) => void;
}

type Step = 1 | 2 | 3;

export function NewRequestPage({ onAddRequest }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Hospitals loaded from Supabase
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  // Form state
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [urgency, setUrgency] = useState<BloodRequest['urgency']>('urgent');
  const [units, setUnits] = useState(1);
  const [hospitalId, setHospitalId] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Load hospitals on mount
  useEffect(() => {
    fetchHospitals()
      .then(list => {
        setHospitals(list);
        if (list.length > 0) setHospitalId(list[0].id);
      })
      .catch(console.error)
      .finally(() => setHospitalsLoading(false));
  }, []);

  const canProceedStep1 = bloodType !== '' && urgency;
  const canProceedStep2 = units >= 1 && condition.trim() && hospitalId && location.trim();

  const handleSubmit = async () => {
    if (!bloodType || !hospitalId) return;
    setSubmitting(true);
    try {
      const selectedHospital = hospitals.find(h => h.id === hospitalId);
      const req = await createRequest({
        bloodType,
        urgency,
        unitsNeeded:      units,
        patientCondition: condition,
        location,
        hospitalId,
        hospitalName:     selectedHospital?.name ?? hospitalId,
        notes:            notes || undefined,
      });
      onAddRequest(req);
      navigate(`/requests/${req.id}`);
    } catch (err) {
      console.error('Failed to create request:', err);
      alert('Failed to submit request. Check your Supabase connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (hospitalsLoading) {
    return <LoadingSpinner fullPage message="Loading hospitals..." />;
  }

  return (
    <div className="page-content">
      {submitting && <LoadingSpinner fullPage message="Submitting request & notifying donors..." />}

      {/* Page header */}
      <div className="page-header animate-fadeInUp">
        <div>
          <h1>New Blood Request</h1>
          <p>Fill in the details below to notify nearby compatible donors.</p>
        </div>
        <button className="btn btn--ghost" onClick={() => navigate(-1)} id="new-request-back-btn">
          ← Back
        </button>
      </div>

      {/* Progress steps */}
      <div className="progress-steps animate-fadeInUp">
        {[1, 2, 3].map(s => (
          <div key={s} className={`progress-step ${step === s ? 'progress-step--active' : ''} ${step > s ? 'progress-step--done' : ''}`}>
            <div className="progress-step__num">
              {step > s ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : s}
            </div>
            <span className="progress-step__label">
              {s === 1 ? 'Blood & Urgency' : s === 2 ? 'Patient Details' : 'Review & Submit'}
            </span>
          </div>
        ))}
        <div className="progress-line">
          <div className="progress-line__fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="form-card form-card--wide animate-slideInRight">
          <h3 className="form-section-title">
            <span className="form-section-step">1</span>
            Blood Type &amp; Urgency
          </h3>

          <div className="step1-columns">
            {/* Column 1 — Blood Type */}
            <div className="step1-col">
              <label className="form-label">Blood Type Required *</label>
              <div className="blood-type-grid blood-type-grid--2col">
                {BLOOD_TYPES.map(bt => (
                  <button
                    key={bt}
                    id={`bt-select-${bt.replace('+', 'pos').replace('-', 'neg')}`}
                    className={`blood-type-btn ${bloodType === bt ? 'blood-type-btn--selected' : ''}`}
                    onClick={() => setBloodType(bt)}
                    type="button"
                  >
                    <BloodTypeBadge type={bt} size="md" />
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2 — Urgency */}
            <div className="step1-col">
              <label className="form-label">Urgency Level *</label>
              <div className="urgency-grid urgency-grid--col">
                {(['critical', 'urgent', 'standard'] as const).map(u => (
                  <button
                    key={u}
                    id={`urgency-${u}`}
                    type="button"
                    className={`urgency-btn urgency-btn--${u} ${urgency === u ? 'urgency-btn--selected' : ''}`}
                    onClick={() => setUrgency(u)}
                  >
                    <span className="urgency-btn__icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {u === 'critical' ? <SirenIcon size={18} /> : u === 'urgent' ? <WarningIcon size={18} /> : <ClipboardIcon size={18} />}
                    </span>
                    <span className="urgency-btn__label">{u.charAt(0).toUpperCase() + u.slice(1)}</span>
                    <span className="urgency-btn__desc">
                      {u === 'critical' ? 'Escalates every 10s' : u === 'urgent' ? 'Escalates every 20s' : 'Escalates every 30s'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3 — Continue */}
            <div className="step1-col step1-col--action">
              <label className="form-label">Ready?</label>
              <div className="step1-action-panel">
                <div className="step1-summary">
                  <div className="step1-summary__item">
                    <span className="step1-summary__label">Blood Type</span>
                    <span className="step1-summary__value">
                      {bloodType ? <BloodTypeBadge type={bloodType} size="sm" /> : <span style={{ color: 'var(--color-text-faint)' }}>Not selected</span>}
                    </span>
                  </div>
                  <div className="step1-summary__item">
                    <span className="step1-summary__label">Urgency</span>
                    <span className="step1-summary__value" style={{
                      color: urgency === 'critical' ? '#ff6b6b' : urgency === 'urgent' ? 'var(--color-warning-light)' : 'var(--color-text-secondary)'
                    }}>
                      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn--primary btn--lg step1-continue-btn"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                  id="step1-next-btn"
                >
                  Continue →
                </button>
                {!canProceedStep1 && (
                  <p className="step1-hint">Select a blood type to continue</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="form-card animate-slideInRight">
          <h3 className="form-section-title">
            <span className="form-section-step">2</span>
            Patient &amp; Location Details
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="units-input">Units Required *</label>
              <div className="units-input-wrap">
                <button className="units-btn" onClick={() => setUnits(u => Math.max(1, u - 1))} type="button" id="units-dec" aria-label="Decrease units">−</button>
                <div className="units-display" id="units-input" aria-live="polite">{units}</div>
                <button className="units-btn" onClick={() => setUnits(u => Math.min(10, u + 1))} type="button" id="units-inc" aria-label="Increase units">+</button>
              </div>
              <span className="form-hint">1–10 units</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="hospital-select">Hospital *</label>
              <select
                id="hospital-select"
                className="form-select"
                value={hospitalId}
                onChange={e => setHospitalId(e.target.value)}
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="condition-input">Patient Condition / Reason *</label>
            <input
              id="condition-input"
              type="text"
              className="form-input"
              placeholder="e.g. Emergency surgery — road accident victim"
              value={condition}
              onChange={e => setCondition(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="location-input">Specific Location in Hospital *</label>
            <input
              id="location-input"
              type="text"
              className="form-input"
              placeholder="e.g. OT Block 3, Ward 5"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes-input">Additional Notes</label>
            <textarea
              id="notes-input"
              className="form-textarea"
              placeholder="Any additional information for donors or staff..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn btn--ghost btn--lg" onClick={() => setStep(1)} id="step2-back-btn">← Back</button>
            <button
              className="btn btn--primary btn--lg"
              disabled={!canProceedStep2}
              onClick={() => setStep(3)}
              id="step2-next-btn"
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="form-card animate-slideInRight">
          <h3 className="form-section-title">
            <span className="form-section-step">3</span>
            Review &amp; Submit
          </h3>
          <div className="review-grid">
            <ReviewItem label="Blood Type" value={<BloodTypeBadge type={bloodType as BloodType} size="md" />} />
            <ReviewItem label="Urgency" value={urgency.charAt(0).toUpperCase() + urgency.slice(1)} />
            <ReviewItem label="Units" value={`${units} unit${units > 1 ? 's' : ''}`} />
            <ReviewItem label="Hospital" value={hospitals.find(h => h.id === hospitalId)?.name || ''} />
            <ReviewItem label="Condition" value={condition} wide />
            <ReviewItem label="Location" value={location} wide />
            {notes && <ReviewItem label="Notes" value={notes} wide />}
          </div>

          <div className="form-actions">
            <button className="btn btn--ghost btn--lg" onClick={() => setStep(2)} id="step3-back-btn">← Back</button>
            <button
              className="btn btn--primary btn--lg"
              onClick={handleSubmit}
              id="submit-request-btn"
              style={{ animation: 'glow-pulse 2s ease-in-out infinite', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <SirenIcon size={20} /> Submit Request & Notify Donors
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewItem({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`review-item ${wide ? 'review-item--wide' : ''}`}>
      <span className="review-item__label">{label}</span>
      <span className="review-item__value">{value}</span>
    </div>
  );
}
