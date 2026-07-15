// ──────────────────────────────────────────────
//  BloodLink — Header (Premium)
// ──────────────────────────────────────────────
import { Link } from 'react-router-dom';
import './Header.css';

interface Props {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuToggle, sidebarOpen }: Props) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          id="sidebar-toggle"
          className="btn--menu mobile-only"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>

        <Link to="/" className="app-header__logo" id="header-logo-link">
          <span className="app-header__logo-icon animate-heartbeat">
            <img src="/Bloodlink.svg" alt="BloodLink Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          </span>
          <span className="app-header__logo-text">
            Blood<span className="app-header__logo-accent">Link</span>
          </span>
        </Link>
      </div>

      <div className="app-header__right">
        <div className="app-header__status">
          <span className="dot dot--pulse" style={{ background: 'var(--color-success-light)' }} />
          <span className="app-header__status-text">System Live</span>
        </div>

        <div className="app-header__sep" />

        <Link to="/requests/new" className="header-cta" id="header-new-request-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Request
        </Link>

        <div className="app-header__avatar" title="Hospital Staff" aria-label="User account">
          HS
        </div>
      </div>
    </header>
  );
}
