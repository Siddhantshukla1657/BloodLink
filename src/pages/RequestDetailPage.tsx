// ──────────────────────────────────────────────
//  BloodLink — Request Detail Page
//  Live-updating status view with escalation timer
// ──────────────────────────────────────────────
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BloodTypeBadge } from '../components/ui/BloodTypeBadge';
import { StateBadge } from '../components/ui/StateBadge';
import { SimulatedTag } from '../components/ui/SimulatedTag';
import {
  HourglassIcon,
  CheckIcon,
  CrossIcon,
  PinIcon,
  PartyIcon,
  UsersIcon,
  PhoneIcon
} from '../components/ui/Icons';
import type { BloodRequest } from '../types';
import './RequestDetailPage.css';

interface Props {
  request: BloodRequest;
  onCancel: (id: string) => void;
}

function EscalationTimer({ requestId, timerMs, updatedAt, state }: {
  requestId: string;
  timerMs: number;
  updatedAt: string;
  state: BloodRequest['state'];
}) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (state === 'matched' || state === 'expired' || state === 'cancelled') return;
    const update = () => {
      const elapsed = Date.now() - new Date(updatedAt).getTime();
      const rem = Math.max(0, timerMs - elapsed);
      setRemaining(rem);
    };
    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [requestId, timerMs, updatedAt, state]);

  if (state === 'matched' || state === 'expired' || state === 'cancelled') return null;

  const pct = Math.min(100, (1 - remaining / timerMs) * 100);
  const secs = Math.ceil(remaining / 1000);

  return (
    <div className="escalation-timer">
      <div className="escalation-timer__header">
        <span className="escalation-timer__label">
          <span className="dot dot--pulse" style={{ background: 'var(--color-warning)' }} />
          Next Escalation
        </span>
        <span className="escalation-timer__secs">{secs}s</span>
      </div>
      <div className="escalation-timer__bar">
        <div className="escalation-timer__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DonorCard({ donor }: {
  donor: BloodRequest['notifiedDonors'][0];
}) {
  const statusColor = {
    pending:  'var(--color-warning)',
    accepted: 'var(--color-success)',
    declined: 'var(--color-error)',
  }[donor.responseStatus];

  const statusIcon = {
    pending: <HourglassIcon size={16} />,
    accepted: <CheckIcon size={16} />,
    declined: <CrossIcon size={16} />,
  }[donor.responseStatus];

  return (
    <div className={`donor-card ${donor.responseStatus !== 'pending' ? 'donor-card--responded' : ''}`}>
      <div className="donor-card__avatar" style={{ borderColor: statusColor }}>
        {donor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div className="donor-card__info">
        <div className="donor-card__name">{donor.name}</div>
        <div className="donor-card__meta">
          <BloodTypeBadge type={donor.bloodType} size="sm" />
          <span className="donor-card__distance" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <PinIcon size={14} /> {donor.distanceKm}km
          </span>
          <span className="donor-card__tier">Tier {donor.tier}</span>
        </div>
        <div className="donor-card__tags">
          <SimulatedTag channel="SMS" small />
          {donor.notifiedAt && (
            <span className="donor-card__time text-muted">
              notified {new Date(donor.notifiedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      <div className="donor-card__status">
        <span className="donor-card__status-icon" style={{ display: 'inline-flex', alignItems: 'center', color: statusColor }}>{statusIcon}</span>
        <span className="donor-card__status-label" style={{ color: statusColor }}>
          {donor.responseStatus.charAt(0).toUpperCase() + donor.responseStatus.slice(1)}
        </span>
      </div>
    </div>
  );
}

function TimelineStep({ label, time, active, done }: { label: string; time?: string; active: boolean; done: boolean }) {
  return (
    <div className={`timeline-step ${active ? 'timeline-step--active' : ''} ${done ? 'timeline-step--done' : ''}`}>
      <div className="timeline-step__indicator">
        <div className="timeline-step__dot" />
        <div className="timeline-step__line" />
      </div>
      <div className="timeline-step__content">
        <span className="timeline-step__label">{label}</span>
        {time && <span className="timeline-step__time">{new Date(time).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}

const STATE_ORDER: BloodRequest['state'][] = ['pending', 'tier1_notified', 'tier2_notified', 'matched'];
const STATE_LABELS: Record<string, string> = {
  pending:        'Request Created',
  tier1_notified: 'Tier 1 Donors Notified',
  tier2_notified: 'Tier 2 Donors Notified',
  matched:        'Donor Matched ✓',
};

export function RequestDetailPage({ request, onCancel }: Props) {
  const navigate = useNavigate();

  // Force re-render on request changes
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(intervalRef.current);
  }, []);

  const currentStateIdx = STATE_ORDER.indexOf(request.state);
  const isTerminal = request.state === 'matched' || request.state === 'expired' || request.state === 'cancelled';

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header animate-fadeInUp">
        <div>
          <div className="request-detail__breadcrumb">
            <button className="btn--link" onClick={() => navigate('/requests')} id="detail-back-btn">← Requests</button>
            <span className="text-muted">/</span>
            <span className="text-muted font-mono">{request.id}</span>
          </div>
          <h1 className="request-detail__title">
            <BloodTypeBadge type={request.bloodType} size="lg" />
            Blood Request — {request.id}
          </h1>
          <p>{request.hospitalName} · {request.location}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
          <StateBadge state={request.state} />
          {!isTerminal && (
            <button
              className="btn btn--danger"
              onClick={() => { if (confirm('Cancel this request?')) onCancel(request.id); }}
              id="cancel-request-btn"
            >
              Cancel Request
            </button>
          )}
        </div>
      </div>

      <div className="request-detail-grid">
        {/* Left column */}
        <div className="request-detail-main">
          {/* Escalation Timer */}
          {!isTerminal && (
            <EscalationTimer
              requestId={request.id}
              timerMs={request.escalationTimerMs}
              updatedAt={request.updatedAt}
              state={request.state}
            />
          )}

          {/* Matched Banner */}
          {request.state === 'matched' && request.matchedDonor && (
            <div className="matched-banner animate-fadeIn">
              <div className="matched-banner__icon" style={{ display: 'inline-flex', color: 'var(--color-success)' }}>
                <PartyIcon size={24} />
              </div>
              <div className="matched-banner__content">
                <h3 className="matched-banner__title">Donor Matched!</h3>
                <p className="matched-banner__donor" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <strong>{request.matchedDonor.name}</strong> has confirmed.
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                    <PinIcon size={14} /> {request.matchedDonor.distanceKm}km away
                  </span> — ETA ~{Math.ceil(request.matchedDonor.distanceKm * 4)} min
                </p>
                <SimulatedTag channel="SMS" />
              </div>
            </div>
          )}

          {/* Donors List */}
          <div className="card" style={{ marginTop: 'var(--sp-5)' }}>
            <div className="section-header">
              <h3>Notified Donors ({request.notifiedDonors.length})</h3>
              <SimulatedTag />
            </div>
            {request.notifiedDonors.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-8) 0' }}>
                <div className="empty-state__icon" style={{ display: 'inline-flex', color: 'var(--color-text-muted)' }}>
                  <UsersIcon size={40} />
                </div>
                <p className="empty-state__title">No donors notified yet</p>
                <p className="empty-state__desc">Donors will appear here as the state machine escalates</p>
              </div>
            ) : (
              <div className="donors-list stagger-children">
                {request.notifiedDonors.map(donor => (
                  <DonorCard
                    key={donor.id}
                    donor={donor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — details + timeline */}
        <div className="request-detail-sidebar">
          {/* Request Details */}
          <div className="card">
            <h4 className="mb-4">Request Details</h4>
            <dl className="detail-list">
              <dt>Patient Condition</dt>
              <dd>{request.patientCondition}</dd>
              <dt>Units Required</dt>
              <dd>{request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''}</dd>
              <dt>Urgency</dt>
              <dd style={{ textTransform: 'capitalize', color: request.urgency === 'critical' ? '#E74C3C' : request.urgency === 'urgent' ? '#E67E22' : 'inherit' }}>
                {request.urgency}
              </dd>
              <dt>Location</dt>
              <dd>{request.location}</dd>
              <dt>Created</dt>
              <dd>{new Date(request.createdAt).toLocaleString()}</dd>
              {request.notes && <><dt>Notes</dt><dd>{request.notes}</dd></>}
            </dl>
          </div>

          {/* Timeline */}
          <div className="card" style={{ marginTop: 'var(--sp-4)' }}>
            <h4 className="mb-4">State Timeline</h4>
            <div className="timeline">
              {STATE_ORDER.map((s, i) => {
                const isDone  = currentStateIdx > i || (request.state === 'matched' && s === 'matched');
                const isActive = currentStateIdx === i;
                const time = s === 'pending' ? request.createdAt : s === request.state ? request.updatedAt : undefined;
                return (
                  <TimelineStep
                    key={s}
                    label={STATE_LABELS[s]}
                    time={isDone || isActive ? time : undefined}
                    active={isActive}
                    done={isDone}
                  />
                );
              })}
              {(request.state === 'expired' || request.state === 'cancelled') && (
                <TimelineStep
                  label={request.state === 'expired' ? 'Request Expired' : 'Request Cancelled'}
                  time={request.updatedAt}
                  active={false}
                  done={true}
                />
              )}
            </div>
          </div>

          {/* Donor Respond Link */}
          {!isTerminal && request.notifiedDonors.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 'var(--sp-3)' }}>
                Simulate a donor responding to this request:
              </p>
              <a
                href={`/donor/${request.id}/${request.notifiedDonors[0]?.id}`}
                className="btn btn--ghost w-full"
                id="donor-respond-link"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={(e) => { e.preventDefault(); navigate(`/donor/${request.id}/${request.notifiedDonors[0]?.id}`); }}
              >
                <PhoneIcon size={16} /> Open Donor View
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
