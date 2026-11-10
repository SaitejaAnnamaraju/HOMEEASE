import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';

const ICONS = { success: 'check', info: 'info', warning: 'info', error: 'x' };

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            <Icon name={ICONS[t.type] || 'info'} size={16} strokeWidth={2.4} />
          </span>
          <span>{t.message}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
