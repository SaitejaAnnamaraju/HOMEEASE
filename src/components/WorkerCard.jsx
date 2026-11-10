import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatINR, serviceName, availabilitySummary } from '../utils/helpers.js';
import { Avatar, Rating, ServiceChips } from './Common.jsx';
import Icon from './Icon.jsx';

export default function WorkerCard({ worker, query = '', highlight = [] }) {
  const { user, db, toast } = useApp();
  const navigate = useNavigate();
  const saved = user?.savedWorkers?.includes(worker.id);
  const slots = availabilitySummary(worker).filter((d) => d.available);

  const toggleSave = () => {
    if (!user) {
      toast('Log in as a customer to save helpers.', 'info');
      navigate(`/login?redirect=${encodeURIComponent('/helpers')}`);
      return;
    }
    if (user.role !== 'customer') {
      toast('Only customer accounts can save helpers.', 'info');
      return;
    }
    const nowSaved = db.toggleSavedWorker(user.id, worker.id);
    toast(nowSaved ? `${worker.name} saved to favourites.` : `${worker.name} removed from favourites.`, 'success');
  };

  return (
    <article className="worker-card">
      <div className="wc-top">
        <Avatar src={worker.photo} name={worker.name} size={72} className="wc-photo" />
        <div className="wc-id">
          <h3>
            <Link to={`/workers/${worker.id}`}>{worker.name}</Link>
            {worker.verified && (
              <span className="verified" title="Background verified">
                <Icon name="shield" size={16} />
              </span>
            )}
          </h3>
          <p className="wc-meta">
            <Icon name="pin" size={14} /> {worker.location} · {worker.experience} yrs exp
          </p>
          <Rating value={worker.rating} count={worker.reviewCount} />
        </div>
        <button
          className={`save-btn ${saved ? 'saved' : ''}`}
          onClick={toggleSave}
          aria-label={saved ? 'Remove from saved' : 'Save helper'}
          aria-pressed={!!saved}
        >
          <Icon name="heart" size={18} fill={saved} />
        </button>
      </div>

      <ServiceChips
        ids={[...worker.services].sort((a, b) => highlight.includes(b) - highlight.includes(a))}
        names={serviceName}
        max={4}
        highlight={highlight}
      />

      <div className="wc-slots">
        <Icon name="clock" size={14} />
        {slots.length ? (
          <span>
            {slots
              .slice(0, 2)
              .map((s) => `${s.day.slice(0, 3)} ${s.label.replace(/ \(.*\)/, '')}`)
              .join(' · ')}
            {slots.length > 2 && <em> +{slots.length - 2} more days</em>}
          </span>
        ) : (
          <span>Currently unavailable</span>
        )}
      </div>

      <div className="wc-foot">
        <div className="price">
          <b>{formatINR(worker.hourlyRate)}</b>
          <span>/hour</span>
        </div>
        <div className="wc-actions">
          <Link to={`/workers/${worker.id}`} className="btn btn-ghost btn-sm">
            View Profile
          </Link>
          <Link to={`/book/${worker.id}${query}`} className="btn btn-primary btn-sm">
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
