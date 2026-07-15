// ──────────────────────────────────────────────
//  BloodLink — StateBadge component
// ──────────────────────────────────────────────
import type { BloodRequest } from '../../types';
import './StateBadge.css';

interface Props {
  state: BloodRequest['state'];
  showDot?: boolean;
}

const STATE_META: Record<BloodRequest['state'], { label: string; color: string; pulse: boolean }> = {
  pending:         { label: 'Pending',         color: 'badge-state--pending',   pulse: false },
  tier1_notified:  { label: 'Tier 1 Notified', color: 'badge-state--tier1',     pulse: true  },
  tier2_notified:  { label: 'Tier 2 Notified', color: 'badge-state--tier2',     pulse: true  },
  matched:         { label: 'Matched',         color: 'badge-state--matched',   pulse: false },
  expired:         { label: 'Expired',         color: 'badge-state--expired',   pulse: false },
  cancelled:       { label: 'Cancelled',       color: 'badge-state--cancelled', pulse: false },
};

export function StateBadge({ state, showDot = true }: Props) {
  const meta = STATE_META[state];
  return (
    <span className={`badge state-badge ${meta.color}`}>
      {showDot && (
        <span className={`dot ${meta.pulse ? 'dot--pulse' : ''}`} />
      )}
      {meta.label}
    </span>
  );
}
