import { useApp } from '../context/AppContext.jsx';
import { timeAgo } from '../utils/helpers.js';
import Icon from './Icon.jsx';
import { EmptyState } from './Common.jsx';

const ICON = { success: 'check', info: 'bell', warning: 'info', error: 'x' };

export default function NotificationList({ userId, limit, compact = false }) {
  const { db, toast } = useApp();
  const all = db.getNotifications(userId);
  const list = limit ? all.slice(0, limit) : all;
  const unread = all.filter((n) => !n.read).length;

  if (!all.length) return <EmptyState icon="bell" title="You're all caught up" text="New updates about your bookings will appear here." />;

  return (
    <div className="notifications">
      {!compact && (
        <div className="row-between mb-12">
          <p className="muted">{unread ? `${unread} unread` : 'No unread notifications'}</p>
          <div className="btn-row">
            <button className="btn btn-ghost btn-sm" disabled={!unread} onClick={() => db.markNotificationsRead(userId)}>
              <Icon name="check" size={16} /> Mark all read
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                db.clearNotifications(userId);
                toast('Notifications cleared.', 'info');
              }}
            >
              <Icon name="trash" size={16} /> Clear
            </button>
          </div>
        </div>
      )}
      <ul className="notif-list">
        {list.map((n) => (
          <li key={n.id} className={`notif ${n.read ? '' : 'unread'} type-${n.type}`}>
            <span className="notif-icon">
              <Icon name={ICON[n.type] || 'bell'} size={16} />
            </span>
            <div>
              <p>{n.message}</p>
              <small>{timeAgo(n.createdAt)}</small>
            </div>
            {!n.read && (
              <button className="link-btn" onClick={() => db.markNotificationsRead(userId, n.id)}>
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
