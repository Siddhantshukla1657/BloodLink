// ──────────────────────────────────────────────
//  BloodLink — Dashboard Page (Premium)
// ──────────────────────────────────────────────
import React from 'react';
import { Link } from 'react-router-dom';
import { BloodTypeBadge } from '../components/ui/BloodTypeBadge';
import { StateBadge }     from '../components/ui/StateBadge';
import {
  SirenIcon,
  ClipboardIcon,
  LightningIcon,
  UsersIcon,
  CheckIcon,
  TimerIcon,
  PlusIcon,
  CrossIcon,
  SearchIcon,
} from '../components/ui/Icons';
import type { BloodRequest, DashboardStats, Donor, Hospital, BloodType } from '../types';
import './DashboardPage.css';

interface Props {
  requests: BloodRequest[];
  stats: DashboardStats;
  donors: Donor[];
  hospitals: Hospital[];
  onAddDonor: (params: { name: string; bloodType: BloodType; phone: string; city: string; distanceKm: number; tier: 1 | 2 }) => Promise<Donor>;
  onAddHospital: (params: { name: string; address: string; city: string; lat: number; lng: number }) => Promise<Hospital>;
}


interface StatCardProps {
  label:    string;
  value:    number | string;
  icon:     React.ReactNode;
  sub?:     string;
  color?:   string;
  iconBg?:  string;
  iconBorder?: string;
  accent?:  string;
  trend?:   string;
}

function StatCard({ label, value, icon, sub, color, iconBg, iconBorder, accent, trend }: StatCardProps) {
  return (
    <div
      className="stat-card animate-fadeInUp"
      style={{
        ['--stat-color'  as string]: color,
        ['--stat-accent' as string]: accent,
        ['--stat-icon-bg' as string]: iconBg,
        ['--stat-icon-border' as string]: iconBorder,
      }}
    >
      <div className="stat-card__header">
        <div className="stat-card__icon-wrap" style={{ color }}>
          {icon}
        </div>
        {trend && <span className="stat-card__trend">{trend}</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function DashboardPage({ requests, stats, donors, hospitals, onAddDonor, onAddHospital }: Props) {
  const activeRequests = requests.filter(r =>
    ['pending', 'tier1_notified', 'tier2_notified'].includes(r.state)
  );
  const recentRequests = requests.slice(0, 6);

  const [activeTab, setActiveTab] = React.useState<'donors' | 'hospitals'>('donors');
  const [donorSearch, setDonorSearch] = React.useState('');
  const [hospitalSearch, setHospitalSearch] = React.useState('');

  const [showAddDonor, setShowAddDonor] = React.useState(false);
  const [showAddHospital, setShowAddHospital] = React.useState(false);

  const [donorForm, setDonorForm] = React.useState({
    name: '',
    bloodType: 'O-' as BloodType,
    phone: '',
    city: '',
    distanceKm: 0,
    tier: 1 as 1 | 2,
  });

  const [hospitalForm, setHospitalForm] = React.useState({
    name: '',
    address: '',
    city: '',
    lat: 0,
    lng: 0,
  });

  const handleDonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddDonor(donorForm);
      setShowAddDonor(false);
      setDonorForm({
        name: '',
        bloodType: 'O-',
        phone: '',
        city: '',
        distanceKm: 0,
        tier: 1,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddHospital(hospitalForm);
      setShowAddHospital(false);
      setHospitalForm({
        name: '',
        address: '',
        city: '',
        lat: 0,
        lng: 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDonors = donors.filter(d =>
    d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
    d.bloodType.toLowerCase().includes(donorSearch.toLowerCase()) ||
    d.city.toLowerCase().includes(donorSearch.toLowerCase())
  );

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.address.toLowerCase().includes(hospitalSearch.toLowerCase())
  );


  return (
    <div className="page-content">

      {/* ── Hero ── */}
      <section className="dashboard-hero animate-fadeInUp">
        <div className="dashboard-hero__stripe" />

        <div className="dashboard-hero__text">
          <div className="dashboard-hero__eyebrow">
            <span className="dot dot--pulse" style={{ background: 'var(--color-primary-light)' }} />
            Real-time Blood Matching
          </div>

          <h1 className="dashboard-hero__title">
            <span className="animate-heartbeat" style={{ display: 'inline-flex', filter: 'drop-shadow(0 0 12px rgba(224,32,32,0.55))' }}>
              <img src="/Bloodlink.svg" alt="BloodLink" style={{ width: 60, height: 60, objectFit: 'contain' }} />
            </span>
            BloodLink Command Center
          </h1>

          <p className="dashboard-hero__desc">
            Real-time donor–hospital matching engine.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <Link to="/requests/new" className="hero-btn-primary" id="dashboard-new-request-btn">
            <SirenIcon size={18} />
            Submit Blood Request
          </Link>
          <Link to="/requests" className="hero-btn-secondary" id="dashboard-view-requests-btn">
            <ClipboardIcon size={18} />
            View All Requests
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="dashboard-stats grid-4 stagger animate-fadeInUp" style={{ marginBottom: 'var(--sp-8)' }}>
        <StatCard
          label="Active Requests"
          value={stats.activeRequests}
          icon={<LightningIcon size={20} />}
          sub="in escalation queue"
          color="var(--color-warning)"
          iconBg="rgba(245,158,11,0.1)"
          iconBorder="rgba(245,158,11,0.2)"
          accent="var(--color-warning)"
          trend="Live"
        />
        <StatCard
          label="Donors Available"
          value={stats.donorsAvailable}
          icon={<UsersIcon size={20} />}
          sub="in donor pool"
          color="var(--color-success-light)"
          iconBg="rgba(16,185,129,0.1)"
          iconBorder="rgba(16,185,129,0.2)"
          accent="var(--color-success)"
          trend="Active"
        />
        <StatCard
          label="Matched Today"
          value={stats.matchedToday}
          icon={<CheckIcon size={20} />}
          sub="successful matches"
          color="#60a5fa"
          iconBg="rgba(59,130,246,0.1)"
          iconBorder="rgba(59,130,246,0.2)"
          accent="#3b82f6"
          trend="Today"
        />
        <StatCard
          label="Avg Response"
          value={`${stats.avgResponseTimeMin}m`}
          icon={<TimerIcon size={20} />}
          sub="donor response time"
          color="var(--color-primary-light)"
          iconBg="rgba(224,32,32,0.1)"
          iconBorder="rgba(224,32,32,0.2)"
          accent="var(--color-primary)"
          trend="Avg"
        />
      </section>

      {/* ── Active Alerts ── */}
      {activeRequests.length > 0 && (
        <section className="dashboard-section animate-fadeInUp">
          <div className="section-header">
            <h2 className="dashboard-section-title">
              <span className="dot dot--pulse" style={{ background: 'var(--color-primary)', width: 8, height: 8 }} />
              Active Requests
            </h2>
            <Link to="/requests" className="btn btn--ghost btn--sm" id="dashboard-see-all-btn">
              See all →
            </Link>
          </div>
          <div className="requests-list stagger">
            {activeRequests.map(req => (
              <RequestRow key={req.id} req={req} />
            ))}
          </div>
        </section>
      )}

      {/* ── State Machine ── */}
      <section className="dashboard-section animate-fadeInUp">
        <h2 className="dashboard-section-title mb-4">Request State Machine</h2>
        <div className="card state-machine-card">
          <div className="state-machine">
            {(['pending', 'tier1_notified', 'tier2_notified', 'matched'] as BloodRequest['state'][]).map((s, i, arr) => (
              <div key={s} className="state-machine__step">
                <StateBadge state={s} />
                {i < arr.length - 1 && (
                  <div className="state-machine__arrow">
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <path d="M13 1l6 5-6 5M1 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="state-machine__desc">
            Requests automatically escalate through tiers. Tier 1 notifies nearby donors; Tier 2 expands the radius.
          </p>
        </div>
      </section>

      {/* ── Donors & Hospitals Boards ── */}
      <section className="dashboard-section animate-fadeInUp">
        <div className="section-header">
          <h2 className="dashboard-section-title">
            <UsersIcon size={22} style={{ color: 'var(--color-primary-light)' }} />
            Resource Management Boards
          </h2>
          <div className="board-tabs">
            <button
              className={`board-tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
              onClick={() => setActiveTab('donors')}
            >
              Donors Pool ({donors.length})
            </button>
            <button
              className={`board-tab-btn ${activeTab === 'hospitals' ? 'active' : ''}`}
              onClick={() => setActiveTab('hospitals')}
            >
              Hospital Network ({hospitals.length})
            </button>
          </div>
        </div>

        {activeTab === 'donors' ? (
          <div className="card board-card animate-scaleIn">
            <div className="board-toolbar">
              <div className="board-search-wrap">
                <SearchIcon size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search donors by name, blood type, city..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                  className="board-search-input"
                />
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => setShowAddDonor(true)}>
                <PlusIcon size={16} /> Add Donor
              </button>
            </div>

            <div className="board-table-wrap">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Blood Type</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Distance</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty">No donors found.</td>
                    </tr>
                  ) : (
                    filteredDonors.map(d => (
                      <tr key={d.id}>
                        <td className="font-semibold">{d.name}</td>
                        <td><BloodTypeBadge type={d.bloodType} size="sm" /></td>
                        <td className="font-mono text-xs">{d.phone}</td>
                        <td>{d.city}</td>
                        <td>{d.distanceKm} km</td>
                        <td>
                          <span className={`badge ${d.tier === 1 ? 'badge--green' : 'badge--amber'}`}>
                            Tier {d.tier}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card board-card animate-scaleIn">
            <div className="board-toolbar">
              <div className="board-search-wrap">
                <SearchIcon size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search hospitals by name, city, address..."
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  className="board-search-input"
                />
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => setShowAddHospital(true)}>
                <PlusIcon size={16} /> Add Hospital
              </button>
            </div>

            <div className="board-table-wrap">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Hospital Name</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>Coordinates (Lat, Lng)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHospitals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-empty">No hospitals found.</td>
                    </tr>
                  ) : (
                    filteredHospitals.map(h => (
                      <tr key={h.id}>
                        <td className="font-semibold">{h.name}</td>
                        <td className="text-secondary">{h.address}</td>
                        <td>{h.city}</td>
                        <td className="font-mono text-xs text-muted">{h.lat.toFixed(4)}, {h.lng.toFixed(4)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Add Donor Modal ── */}
      {showAddDonor && (
        <div className="modal-overlay">
          <div className="modal-content animate-scaleIn">
            <div className="modal-header">
              <h3>Register New Donor</h3>
              <button className="modal-close" onClick={() => setShowAddDonor(false)}>
                <CrossIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleDonorSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Mehta"
                  value={donorForm.name}
                  onChange={(e) => setDonorForm({...donorForm, name: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Blood Type</label>
                  <select
                    value={donorForm.bloodType}
                    onChange={(e) => setDonorForm({...donorForm, bloodType: e.target.value as BloodType})}
                    className="form-select"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tier</label>
                  <select
                    value={donorForm.tier}
                    onChange={(e) => setDonorForm({...donorForm, tier: Number(e.target.value) as 1 | 2})}
                    className="form-select"
                  >
                    <option value={1}>Tier 1 (Immediate / Radius &lt; 5km)</option>
                    <option value={2}>Tier 2 (Extended / Radius &gt; 5km)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9812345678"
                  value={donorForm.phone}
                  onChange={(e) => setDonorForm({...donorForm, phone: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi"
                    value={donorForm.city}
                    onChange={(e) => setDonorForm({...donorForm, city: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="e.g. 2.5"
                    value={donorForm.distanceKm || ''}
                    onChange={(e) => setDonorForm({...donorForm, distanceKm: parseFloat(e.target.value) || 0})}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowAddDonor(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Register Donor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Hospital Modal ── */}
      {showAddHospital && (
        <div className="modal-overlay">
          <div className="modal-content animate-scaleIn">
            <div className="modal-header">
              <h3>Register New Hospital</h3>
              <button className="modal-close" onClick={() => setShowAddHospital(false)}>
                <CrossIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleHospitalSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Hospital Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospitals"
                  value={hospitalForm.name}
                  onChange={(e) => setHospitalForm({...hospitalForm, name: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarita Vihar, Main Road"
                  value={hospitalForm.address}
                  onChange={(e) => setHospitalForm({...hospitalForm, address: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi"
                  value={hospitalForm.city}
                  onChange={(e) => setHospitalForm({...hospitalForm, city: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="e.g. 28.5355"
                    value={hospitalForm.lat || ''}
                    onChange={(e) => setHospitalForm({...hospitalForm, lat: parseFloat(e.target.value) || 0})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="e.g. 77.2900"
                    value={hospitalForm.lng || ''}
                    onChange={(e) => setHospitalForm({...hospitalForm, lng: parseFloat(e.target.value) || 0})}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowAddHospital(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Register Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Recent Activity ── */}
      <section className="dashboard-section animate-fadeInUp">
        <div className="section-header">
          <h2 className="dashboard-section-title">Recent Activity</h2>
        </div>
        <div className="requests-list stagger">
          {recentRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ color: 'var(--color-text-muted)' }}>
                <ClipboardIcon size={40} />
              </div>
              <p className="empty-state__title">No requests yet</p>
              <p className="empty-state__desc">Submit your first blood request to get started.</p>
              <Link to="/requests/new" className="btn btn--primary btn--sm" style={{ marginTop: 'var(--sp-2)' }}>
                + New Request
              </Link>
            </div>
          ) : (
            recentRequests.map(req => <RequestRow key={req.id} req={req} />)
          )}
        </div>
      </section>
    </div>
  );
}

function RequestRow({ req }: { req: BloodRequest }) {
  return (
    <Link
      to={`/requests/${req.id}`}
      className="request-row animate-fadeInUp"
      id={`dashboard-req-${req.id}`}
    >
      <div className="request-row__blood">
        <BloodTypeBadge type={req.bloodType} size="md" />
      </div>
      <div className="request-row__info">
        <div className="request-row__top">
          <span className="request-row__id">{req.id.slice(0, 8)}…</span>
          <span className="request-row__hospital">{req.hospitalName}</span>
        </div>
        <p className="request-row__condition">{req.patientCondition}</p>
      </div>
      <div className="request-row__meta">
        <StateBadge state={req.state} />
        <span className="request-row__time">{timeAgo(req.createdAt)}</span>
      </div>
      <div className="request-row__arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}
