// ──────────────────────────────────────────────
//  BloodLink — BloodTypeBadge component
// ──────────────────────────────────────────────
import type { BloodType } from '../../types';
import { BloodIcon } from './Icons';
import './BloodTypeBadge.css';

interface Props {
  type: BloodType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Color map for visual distinction
const BT_COLOR: Record<BloodType, string> = {
  'O-':  'bt--o-neg',
  'O+':  'bt--o-pos',
  'A-':  'bt--a-neg',
  'A+':  'bt--a-pos',
  'B-':  'bt--b-neg',
  'B+':  'bt--b-pos',
  'AB-': 'bt--ab-neg',
  'AB+': 'bt--ab-pos',
};

export function BloodTypeBadge({ type, size = 'md' }: Props) {
  return (
    <span className={`blood-type-badge bt--${size} ${BT_COLOR[type]}`}>
      <span className="blood-type-badge__drop" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <BloodIcon size={14} />
      </span>
      <span className="blood-type-badge__label">{type}</span>
    </span>
  );
}
