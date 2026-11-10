import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Avatar } from './Common.jsx';

export default function DashboardLayout({ base, tabs, user, photo, subtitle, children }) {
  return (
    <div className="dash">
      <div className="container dash-layout">
        <aside className="dash-side">
          <div className="dash-user">
            <Avatar src={photo} name={user.name} size={52} />
            <div>
              <b>{user.name}</b>
              <small>{subtitle}</small>
            </div>
          </div>
          <nav className="dash-nav" aria-label="Dashboard">
            {tabs.map((t) => (
              <NavLink key={t.id} to={t.to || (t.id === 'overview' ? base : `${base}/${t.id}`)} end className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon name={t.icon} size={18} />
                <span>{t.label}</span>
                {t.count > 0 && <em className="count">{t.count}</em>}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="dash-main">{children}</section>
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, hint, tone = 'green' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <span className="stat-icon">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        {hint && <span className="hint">{hint}</span>}
      </div>
    </div>
  );
}
