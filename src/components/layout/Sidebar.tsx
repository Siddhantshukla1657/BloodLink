// ──────────────────────────────────────────────
//  BloodLink — Sidebar navigation (Premium)
// ──────────────────────────────────────────────
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LightningIcon, ClipboardIcon, PlusIcon } from '../ui/Icons';
import './Sidebar.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  id: string;
  badge?: string | number;
}

interface Props {
  activeRequests?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',             label: 'Dashboard',    icon: <LightningIcon size={18} />, id: 'nav-dashboard'   },
  { to: '/requests',     label: 'All Requests', icon: <ClipboardIcon size={18} />, id: 'nav-requests'    },
  { to: '/requests/new', label: 'New Request',  icon: <PlusIcon size={18} />,      id: 'nav-new-request' },
];

export function Sidebar({ activeRequests = 0, isOpen, onClose }: Props) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Navigation */}
        <div className="sidebar__section">
          <span className="sidebar__section-label">Navigation</span>
          <nav className="sidebar__nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
                }
                id={item.id}
                onClick={onClose}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                <span className="sidebar__nav-label">{item.label}</span>
                {item.to === '/requests' && activeRequests > 0 && (
                  <span className="sidebar__badge">{activeRequests}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="sidebar__bottom">
          <div className="sidebar__version-row">
            <span className="sidebar__version">v1.0.0</span>
            <span className="sidebar__version-dot" />
          </div>
        </div>
      </aside>
    </>
  );
}
