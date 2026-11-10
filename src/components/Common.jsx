import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { avatarFallback } from '../utils/helpers.js';

export function Avatar({ src, name, size = 48, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const url = !src || failed ? avatarFallback(name) : src;
  return (
    <img
      className={`avatar ${className}`}
      src={url}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} fill={value >= i - 0.25} className={value >= i - 0.25 ? 'on' : 'off'} />
      ))}
    </span>
  );
}

export function Rating({ value, count }) {
  if (!count) return <span className="rating new">New</span>;
  return (
    <span className="rating">
      <Icon name="star" size={14} fill />
      <b>{Number(value).toFixed(1)}</b>
      <span>({count})</span>
    </span>
  );
}

const STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Confirmed',
  rejected: 'Declined',
  completed: 'Completed',
  cancelled: 'Cancelled'
};
export function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{STATUS_LABEL[status] || status}</span>;
}

export function Modal({ open, title, onClose, children, footer, width = 520 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'light' : ''}`} aria-label="HomeEase home">
      <img src="/images/logo.svg" alt="" width="34" height="34" />
      <span>
        Home<em>Ease</em>
      </span>
    </Link>
  );
}

export function ServiceChips({ ids = [], max = 4, names, highlight = [] }) {
  const shown = ids.slice(0, max);
  return (
    <div className="chips">
      {shown.map((id) => (
        <span className={`chip ${highlight.includes(id) ? 'match' : ''}`} key={id}>
          {highlight.includes(id) && <Icon name="check" size={12} strokeWidth={2.8} />}
          {names ? names(id) : id}
        </span>
      ))}
      {ids.length > max && <span className="chip muted">+{ids.length - max}</span>}
    </div>
  );
}
