// ──────────────────────────────────────────────
//  BloodLink — SimulatedTag component
//  Shows "SIMULATED" label on all mock notifications
// ──────────────────────────────────────────────
import React from 'react';
import { ChatIcon, BellIcon, MailIcon } from './Icons';
import './SimulatedTag.css';

interface Props {
  channel?: 'SMS' | 'Push' | 'Email';
  small?: boolean;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  SMS:   <ChatIcon size={14} style={{ marginRight: '4px' }} />,
  Push:  <BellIcon size={14} style={{ marginRight: '4px' }} />,
  Email: <MailIcon size={14} style={{ marginRight: '4px' }} />,
};

export function SimulatedTag({ channel, small }: Props) {
  return (
    <span className={`simulated-tag ${small ? 'simulated-tag--small' : ''}`}>
      <span className="simulated-tag__dot" />
      {channel && (
        <span className="simulated-tag__channel" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {CHANNEL_ICONS[channel]}
          {channel}
        </span>
      )}
      <span className="simulated-tag__label">SIMULATED</span>
    </span>
  );
}
