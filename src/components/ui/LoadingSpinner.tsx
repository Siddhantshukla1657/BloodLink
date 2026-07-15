// ──────────────────────────────────────────────
//  BloodLink — LoadingSpinner (Premium)
// ──────────────────────────────────────────────
import { BloodIcon } from './Icons';
import './LoadingSpinner.css';

interface Props {
  size?:     'sm' | 'md' | 'lg';
  message?:  string;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 'md', message, fullPage }: Props) {
  const spinner = (
    <div className={`spinner spinner--${size}`}>
      <div className="spinner__ring" />
      <div className="spinner__ring-2" />
      <div className="spinner__drop">
        <BloodIcon size={size === 'sm' ? 10 : size === 'lg' ? 22 : 14} />
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="spinner-overlay">
        <div className="spinner-overlay__badge">
          <div className={`spinner spinner--md`}>
            <div className="spinner__ring" />
            <div className="spinner__ring-2" />
            <div className="spinner__drop">
              <BloodIcon size={14} />
            </div>
          </div>
          {message && <p className="spinner-overlay__msg">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-wrap">
      {spinner}
      {message && <span className="spinner-inline-msg">{message}</span>}
    </div>
  );
}
