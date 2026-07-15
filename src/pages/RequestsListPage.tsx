// ──────────────────────────────────────────────
//  BloodLink — Requests List Page (Premium)
// ──────────────────────────────────────────────
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BloodTypeBadge } from '../components/ui/BloodTypeBadge';
import { StateBadge }     from '../components/ui/StateBadge';
import { SirenIcon, WarningIcon, ClipboardIcon, SearchIcon } from '../components/ui/Icons';
import type { BloodRequest, BloodType } from '../types';
import './RequestsListPage.css';

interface Props { requests: BloodRequest[]; }

type FilterState   = 'all' | BloodRequest['state'];
type FilterUrgency = 'all' | BloodRequest['urgency'];

const URGENCY_ICONS: Record<BloodRequest['urgency'], React.ReactNode> = {
  critical: <SirenIcon size={13} />,
  urgent:   <WarningIcon size={13} />,
  standard: <ClipboardIcon size={13} />,
};

const URGENCY_COLORS: Record<BloodRequest['urgency'], string> = {
  critical: 'var(--color-primary-light)',
  urgent:   'var(--color-warning-light)',
  standard: 'var(--color-text-muted)',
};

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RequestsListPage({ requests }: Props) {
  const [stateFilter,   setStateFilter]   = useState<FilterState>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<FilterUrgency>('all');
  const [bloodFilter,   setBloodFilter]   = useState<BloodType | 'all'>('all');
  const [searchQ,       setSearchQ]       = useState('');

  const filtered = requests.filter(r => {
    if (stateFilter   !== 'all' && r.state   !== stateFilter)   return false;
    if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;
    if (bloodFilter   !== 'all' && r.bloodType !== bloodFilter) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (
        !r.id.toLowerCase().includes(q) &&
        !r.hospitalName.toLowerCase().includes(q) &&
        !r.patientCondition.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const activeCount = requests.filter(r =>
    ['pending', 'tier1_notified', 'tier2_notified'].includes(r.state)
  ).length;

  return (
    <div className="page-content">

      {/* ── Header ── */}
      <div className="page-header animate-fadeInUp">
        <div>
          <h1>All Blood Requests</h1>
          <p>
            <strong style={{ color: 'var(--color-primary-light)' }}>{activeCount} active</strong>
            {' · '}{requests.length} total
          </p>
        </div>
        <Link to="/requests/new" className="btn btn--primary" id="list-new-request-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Request
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="requests-filters animate-fadeInUp">
        <div className="requests-filters__search">
          <div className="search-input-wrap">
            <span className="search-icon">
              <SearchIcon size={16} />
            </span>
            <input
              id="requests-search-input"
              type="search"
              className="form-input"
              placeholder="Search by ID, hospital, or condition…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
        </div>
        <div className="requests-filters__row">
          <div className="filter-group">
            <label className="form-label">State</label>
            <select
              id="filter-state"
              className="form-select"
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value as FilterState)}
            >
              <option value="all">All States</option>
              <option value="pending">Pending</option>
              <option value="tier1_notified">Tier 1 Notified</option>
              <option value="tier2_notified">Tier 2 Notified</option>
              <option value="matched">Matched</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="form-label">Urgency</label>
            <select
              id="filter-urgency"
              className="form-select"
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value as FilterUrgency)}
            >
              <option value="all">All Urgency</option>
              <option value="critical">Critical</option>
              <option value="urgent">Urgent</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="form-label">Blood Type</label>
            <select
              id="filter-blood-type"
              className="form-select"
              value={bloodFilter}
              onChange={e => setBloodFilter(e.target.value as BloodType | 'all')}
            >
              <option value="all">All Types</option>
              {(['O-','O+','A-','A+','B-','B+','AB-','AB+'] as BloodType[]).map(bt => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Count ── */}
      <div className="requests-count animate-fadeIn">
        <span className="requests-count__num">{filtered.length}</span>
        {' '}request{filtered.length !== 1 ? 's' : ''} found
        {filtered.length !== requests.length && (
          <span style={{ color: 'var(--color-text-faint)' }}> (filtered from {requests.length})</span>
        )}
      </div>

      {/* ── Table or Empty ── */}
      {filtered.length === 0 ? (
        <div className="empty-state animate-scaleIn">
          <div className="empty-state__icon" style={{ color: 'var(--color-text-muted)' }}>
            <SearchIcon size={42} />
          </div>
          <p className="empty-state__title">No requests found</p>
          <p className="empty-state__desc">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="requests-table animate-fadeInUp" style={{ overflowX: 'auto' }}>
          <table className="req-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Blood</th>
                <th>Urgency</th>
                <th>Hospital</th>
                <th>Condition</th>
                <th>State</th>
                <th>Donors</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req, i) => (
                <tr
                  key={req.id}
                  className="req-row animate-fadeInUp"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <td className="req-table__id">{req.id.slice(0, 8)}…</td>
                  <td><BloodTypeBadge type={req.bloodType} size="sm" /></td>
                  <td>
                    <span
                      className="req-table__urgency"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: URGENCY_COLORS[req.urgency],
                      }}
                    >
                      {URGENCY_ICONS[req.urgency]}
                      {req.urgency}
                    </span>
                  </td>
                  <td className="req-table__hospital">{req.hospitalName}</td>
                  <td className="req-table__condition truncate" style={{ maxWidth: 180 }}>
                    {req.patientCondition}
                  </td>
                  <td><StateBadge state={req.state} /></td>
                  <td className="req-table__donors">
                    {req.notifiedDonors.length}
                    {req.matchedDonor && ' ✓'}
                  </td>
                  <td className="req-table__time">{timeAgo(req.createdAt)}</td>
                  <td className="req-table__action">
                    <Link
                      to={`/requests/${req.id}`}
                      className="req-view-btn"
                      id={`list-view-${req.id}`}
                    >
                      View
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
