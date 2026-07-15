// ──────────────────────────────────────────────
//  BloodLink — Donor Respond Page
//  Mobile-first. Donor sees request and can confirm/decline.
// ──────────────────────────────────────────────
import { useState } from 'react';
import { BloodTypeBadge } from '../components/ui/BloodTypeBadge';
import { SimulatedTag } from '../components/ui/SimulatedTag';
import {
  SirenIcon,
  WarningIcon,
  ClipboardIcon,
  PartyIcon,
  HeartIcon,
  CheckIcon,
  PinIcon,
  BloodIcon
} from '../components/ui/Icons';
import type { BloodRequest, Donor } from '../types';
import './DonorRespondPage.css';

interface Props {
  request: BloodRequest;
  donor: Donor;
  onRespond: (requestId: string, donorId: string, accepted: boolean) => void;
}

type ResponseState = 'idle' | 'confirming' | 'accepted' | 'declined';

export function DonorRespondPage({ request, donor, onRespond }: Props) {
  const [responseState, setResponseState] = useState<ResponseState>('idle');

  const alreadyResponded = donor.responseStatus !== 'pending';
  const requestMatched = request.state === 'matched';

  const handleAccept = () => {
    setResponseState('confirming');
    setTimeout(() => {
      onRespond(request.id, donor.id, true);
      setResponseState('accepted');
    }, 800);
  };

  const handleDecline = () => {
    setResponseState('confirming');
    setTimeout(() => {
      onRespond(request.id, donor.id, false);
      setResponseState('declined');
    }, 600);
  };

  const urgencyConfig = {
    critical: { label: 'CRITICAL', color: '#E74C3C', bg: 'rgba(231,76,60,0.1)', icon: <SirenIcon size={20} />, pulse: true },
    urgent:   { label: 'URGENT',   color: '#E67E22', bg: 'rgba(230,126,34,0.1)', icon: <WarningIcon size={20} />, pulse: false },
    standard: { label: 'STANDARD', color: '#95A5A6', bg: 'rgba(149,165,166,0.1)',icon: <ClipboardIcon size={20} />, pulse: false },
  }[request.urgency];

  // Post-response screens
  if (responseState === 'accepted' || donor.responseStatus === 'accepted') {
    return (
      <div className="donor-page">
        <div className="donor-page__inner donor-accepted animate-fadeInUp">
          <div className="donor-accepted__icon" style={{ display: 'inline-flex', color: 'var(--color-success)' }}>
            <PartyIcon size={48} />
          </div>
          <h1 className="donor-accepted__title">Thank you, {donor.name.split(' ')[0]}!</h1>
          <p className="donor-accepted__desc">
            You've confirmed. The hospital team will contact you shortly.
          </p>
          <div className="donor-accepted__details">
            <div className="donor-detail-row">
              <span>Hospital</span>
              <strong>{request.hospitalName}</strong>
            </div>
            <div className="donor-detail-row">
              <span>Location</span>
              <strong>{request.location}</strong>
            </div>
            <div className="donor-detail-row">
              <span>Blood Type</span>
              <BloodTypeBadge type={request.bloodType} size="sm" />
            </div>
          </div>
          <SimulatedTag />
          <p className="donor-accepted__sim-note">
            This is a simulated demo. In production, you'd receive a real call and navigation assistance.
          </p>
        </div>
      </div>
    );
  }

  if (responseState === 'declined' || donor.responseStatus === 'declined') {
    return (
      <div className="donor-page">
        <div className="donor-page__inner donor-declined animate-fadeInUp">
          <div className="donor-declined__icon" style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
            <HeartIcon size={48} />
          </div>
          <h1 className="donor-declined__title">We understand.</h1>
          <p className="donor-declined__desc">
            Thank you for your time, {donor.name.split(' ')[0]}. We'll reach out to the next available donor.
          </p>
          <SimulatedTag />
        </div>
      </div>
    );
  }

  if (requestMatched && donor.responseStatus === 'pending') {
    return (
      <div className="donor-page">
        <div className="donor-page__inner animate-fadeInUp" style={{ textAlign: 'center', paddingTop: 'var(--sp-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)', display: 'inline-flex', color: 'var(--color-success)' }}>
            <CheckIcon size={48} />
          </div>
          <h2>This request has already been fulfilled</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--sp-3)' }}>
            Another donor has already been matched. Thank you for being available!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-page">
      <div className="donor-page__inner">
        {/* Demo banner */}
        <div className="donor-demo-banner">
          <SimulatedTag />
          <span className="donor-demo-banner__text">Donor simulation view — no real action is taken</span>
        </div>

        {/* Urgency header */}
        <div
          className={`donor-urgency-header ${urgencyConfig.pulse ? 'donor-urgency-header--pulse' : ''}`}
          style={{ background: urgencyConfig.bg, borderColor: `${urgencyConfig.color}44`, display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <span className="donor-urgency-header__icon" style={{ display: 'inline-flex', color: urgencyConfig.color }}>{urgencyConfig.icon}</span>
          <div>
            <div className="donor-urgency-header__level" style={{ color: urgencyConfig.color }}>
              {urgencyConfig.label} — Blood Needed
            </div>
            <div className="donor-urgency-header__hospital">{request.hospitalName}</div>
          </div>
        </div>

        {/* Blood type */}
        <div className="donor-blood-section">
          <div className="donor-blood-section__type">
            <BloodTypeBadge type={request.bloodType} size="xl" />
          </div>
          <div className="donor-blood-section__details">
            <div className="donor-blood-detail">
              <span className="donor-blood-detail__label">Units Needed</span>
              <span className="donor-blood-detail__value">{request.unitsNeeded}</span>
            </div>
            <div className="donor-blood-detail">
              <span className="donor-blood-detail__label">Distance</span>
              <span className="donor-blood-detail__value">{donor.distanceKm} km</span>
            </div>
            <div className="donor-blood-detail">
              <span className="donor-blood-detail__label">Est. ETA</span>
              <span className="donor-blood-detail__value">~{Math.ceil(donor.distanceKm * 4)} min</span>
            </div>
          </div>
        </div>

        {/* Patient info */}
        <div className="donor-patient-card">
          <h3 className="donor-patient-card__title">Patient Situation</h3>
          <p className="donor-patient-card__condition">{request.patientCondition}</p>
          <div className="donor-patient-card__location" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <PinIcon size={16} /> {request.location}
          </div>
        </div>

        {/* Donor info */}
        <div className="donor-self-info">
          <span className="donor-self-info__label">Your blood type:</span>
          <BloodTypeBadge type={donor.bloodType} size="sm" />
          <span className="donor-self-info__name">— {donor.name}</span>
        </div>

        {/* CTA Buttons */}
        {responseState === 'confirming' ? (
          <div className="donor-confirming">
            <div className="spinner spinner--md" style={{ margin: '0 auto' }}>
              <div className="spinner__ring" />
              <div className="spinner__drop" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <BloodIcon size={14} />
              </div>
            </div>
            <p>Processing...</p>
          </div>
        ) : (
          <div className="donor-actions">
            <button
              id="donor-confirm-btn"
              className="btn btn--success btn--xl w-full donor-cta donor-cta--accept"
              onClick={handleAccept}
              disabled={alreadyResponded}
            >
              ✓ I Can Donate Now
            </button>
            <button
              id="donor-decline-btn"
              className="btn btn--ghost btn--xl w-full donor-cta donor-cta--decline"
              onClick={handleDecline}
              disabled={alreadyResponded}
            >
              ✕ Not Available Right Now
            </button>
          </div>
        )}

        <p className="donor-footer-note">
          By confirming, you agree to proceed to the hospital immediately. Your information will be shared with the hospital team.
        </p>
      </div>
    </div>
  );
}
