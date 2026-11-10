import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { SERVICES, LOCATIONS } from '../../data/constants.js';
import { formatDate, formatINR, formatRange, greeting, serviceNames, todayISO, isValidEmail, isValidPhone } from '../../utils/helpers.js';
import DashboardLayout, { StatCard } from '../../components/DashboardLayout.jsx';
import NotificationList from '../../components/NotificationList.jsx';
import WorkerCard from '../../components/WorkerCard.jsx';
import Icon from '../../components/Icon.jsx';
import { Avatar, EmptyState, Modal, StatusBadge } from '../../components/Common.jsx';

const isUpcoming = (b) => (b.status === 'pending' || b.status === 'accepted') && b.date >= todayISO();

export default function CustomerDashboard() {
  const { tab = 'overview' } = useParams();
  const { user, db } = useApp();
  const bookings = db.getCustomerBookings(user.id).sort((a, b) => (a.date === b.date ? a.startTime - b.startTime : a.date < b.date ? -1 : 1));
  const upcoming = bookings.filter(isUpcoming);
  const previous = bookings.filter((b) => !isUpcoming(b)).reverse();
  const unread = db.getNotifications(user.id).filter((n) => !n.read).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'bookings', label: 'My bookings', icon: 'calendar', count: upcoming.length },
    { id: 'saved', label: 'Saved helpers', icon: 'heart' },
    { id: 'find', label: 'Find helpers', icon: 'search', to: '/helpers' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', count: unread },
    { id: 'profile', label: 'Profile', icon: 'settings' }
  ];
  const valid = ['overview', 'bookings', 'saved', 'notifications', 'profile'];
  if (!valid.includes(tab)) return <Navigate to="/customer" replace />;

  return (
    <DashboardLayout base="/customer" tabs={tabs} user={user} subtitle={`Customer · ${user.location}`}>
      {tab === 'overview' && <Overview user={user} upcoming={upcoming} bookings={bookings} />}
      {tab === 'bookings' && <Bookings upcoming={upcoming} previous={previous} />}
      {tab === 'saved' && <Saved user={user} />}
      {tab === 'notifications' && (
        <>
          <h1 className="dash-title">Notifications</h1>
          <div className="card">
            <NotificationList userId={user.id} />
          </div>
        </>
      )}
      {tab === 'profile' && <Profile user={user} />}
    </DashboardLayout>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ user, upcoming, bookings }) {
  const navigate = useNavigate();
  const [q, setQ] = useState({ service: '', location: user.location });
  const spent = bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + b.total, 0);
  const next = upcoming[0];

  return (
    <>
      <div className="welcome">
        <div>
          <p className="kicker light">{greeting()},</p>
          <h1>{user.name.split(' ')[0]} 👋</h1>
          <p>{next ? `Your next visit is ${formatDate(next.date, { year: false })} with ${next.workerName}.` : 'No visits scheduled. Need a hand at home?'}</p>
        </div>
        <Link to="/helpers" className="btn btn-accent">
          <Icon name="search" size={18} /> Find Helpers
        </Link>
      </div>

      <div className="stats-row">
        <StatCard icon="calendar" label="Upcoming" value={upcoming.length} hint={`${upcoming.filter((b) => b.status === 'pending').length} awaiting reply`} />
        <StatCard icon="check" label="Completed" value={bookings.filter((b) => b.status === 'completed').length} tone="teal" />
        <StatCard icon="heart" label="Saved helpers" value={(user.savedWorkers || []).length} tone="orange" />
        <StatCard icon="wallet" label="Total spent" value={formatINR(spent)} tone="violet" />
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Upcoming bookings</h3>
            <Link to="/customer/bookings" className="link">
              View all
            </Link>
          </div>
          {upcoming.length ? (
            <div className="stack">
              {upcoming.slice(0, 3).map((b) => (
                <BookingRow key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <EmptyState icon="calendar" title="No upcoming bookings" text="Book a helper for the hours you need." action={<Link className="btn btn-primary btn-sm" to="/helpers">Find Helpers</Link>} />
          )}
        </div>

        <div className="stack">
          <form
            className="card quick-find"
            onSubmit={(e) => {
              e.preventDefault();
              const p = new URLSearchParams();
              if (q.service) p.set('service', q.service);
              if (q.location) p.set('location', q.location);
              navigate(`/helpers?${p}`);
            }}
          >
            <h3>Quick find</h3>
            <select value={q.service} onChange={(e) => setQ({ ...q, service: e.target.value })} aria-label="Service">
              <option value="">Any service</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select value={q.location} onChange={(e) => setQ({ ...q, location: e.target.value })} aria-label="Location">
              <option value="">All areas</option>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-block">Search helpers</button>
          </form>
          <div className="card">
            <div className="card-head">
              <h3>Notifications</h3>
              <Link to="/customer/notifications" className="link">
                See all
              </Link>
            </div>
            <NotificationList userId={user.id} limit={3} compact />
          </div>
        </div>
      </div>
    </>
  );
}

function BookingRow({ b }) {
  return (
    <Link to="/customer/bookings" className="booking-row">
      <Avatar src={b.workerPhoto} name={b.workerName} size={44} />
      <div className="grow">
        <b>{b.workerName}</b>
        <small>
          {formatDate(b.date, { year: false })} · {formatRange(b.startTime, b.startTime + b.duration)}
        </small>
      </div>
      <StatusBadge status={b.status} />
    </Link>
  );
}

/* ---------------- Bookings ---------------- */
function Bookings({ upcoming, previous }) {
  const [view, setView] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const { db, toast, user } = useApp();
  const list = view === 'upcoming' ? upcoming : previous;

  const doCancel = () => {
    db.updateBookingStatus(cancelling.id, 'cancelled');
    toast(`Booking ${cancelling.id} cancelled.`, 'info');
    setCancelling(null);
  };

  return (
    <>
      <div className="row-between wrap mb-16">
        <h1 className="dash-title">My bookings</h1>
        <div className="segmented sm">
          <button className={view === 'upcoming' ? 'active' : ''} onClick={() => setView('upcoming')}>
            Upcoming ({upcoming.length})
          </button>
          <button className={view === 'previous' ? 'active' : ''} onClick={() => setView('previous')}>
            History ({previous.length})
          </button>
        </div>
      </div>

      {list.length ? (
        <div className="stack">
          {list.map((b) => (
            <article key={b.id} className={`card booking-card status-${b.status}`}>
              <div className="bc-head">
                <div className="row">
                  <Avatar src={b.workerPhoto} name={b.workerName} size={52} />
                  <div>
                    <Link to={`/workers/${b.workerId}`} className="bc-name">
                      {b.workerName}
                    </Link>
                    <small className="muted block">Booking {b.id}</small>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="bc-grid">
                <div>
                  <small>Date</small>
                  <b>{formatDate(b.date)}</b>
                </div>
                <div>
                  <small>Time</small>
                  <b>{formatRange(b.startTime, b.startTime + b.duration)}</b>
                </div>
                <div>
                  <small>Services</small>
                  <b>{serviceNames(b.services)}</b>
                </div>
                <div>
                  <small>Total</small>
                  <b>
                    {formatINR(b.total)} <span className="muted small">({b.duration} hrs)</span>
                  </b>
                </div>
              </div>
              {b.notes && <p className="bc-notes">“{b.notes}”</p>}
              <div className="bc-actions">
                {isUpcoming(b) && (
                  <button className="btn btn-ghost btn-sm danger-text" onClick={() => setCancelling(b)}>
                    <Icon name="x" size={16} /> Cancel booking
                  </button>
                )}
                {b.status === 'completed' && !b.reviewed && (
                  <button className="btn btn-accent btn-sm" onClick={() => setReviewing(b)}>
                    <Icon name="star" size={16} /> Rate &amp; review
                  </button>
                )}
                {b.status === 'completed' && b.reviewed && (
                  <span className="muted small">
                    <Icon name="check" size={14} /> Reviewed
                  </span>
                )}
                {!isUpcoming(b) && (
                  <Link to={`/book/${b.workerId}`} className="btn btn-ghost btn-sm">
                    <Icon name="refresh" size={16} /> Book again
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon="calendar"
            title={view === 'upcoming' ? 'No upcoming bookings' : 'No past bookings yet'}
            text="When you book a helper, it will show up here."
            action={
              <Link to="/helpers" className="btn btn-primary">
                Find Helpers
              </Link>
            }
          />
        </div>
      )}

      <Modal
        open={!!cancelling}
        title="Cancel this booking?"
        onClose={() => setCancelling(null)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCancelling(null)}>
              Keep booking
            </button>
            <button className="btn btn-danger" onClick={doCancel}>
              Yes, cancel
            </button>
          </>
        }
      >
        {cancelling && (
          <p>
            Your visit with <b>{cancelling.workerName}</b> on {formatDate(cancelling.date)} ({formatRange(cancelling.startTime, cancelling.startTime + cancelling.duration)}) will be
            cancelled and the helper will be notified.
          </p>
        )}
      </Modal>

      <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} user={user} />
    </>
  );
}

function ReviewModal({ booking, onClose, user }) {
  const { db, toast } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (comment.trim().length < 5) {
      setErr('Write a few words about your experience.');
      return;
    }
    db.addReview({ bookingId: booking.id, rating, comment, customer: user });
    toast('Thanks! Your review has been posted.', 'success');
    setComment('');
    setRating(5);
    setErr('');
    onClose();
  };

  return (
    <Modal
      open={!!booking}
      title={booking ? `Rate ${booking.workerName}` : ''}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Post review
          </button>
        </>
      }
    >
      <div className="star-input" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={rating === i} className={rating >= i ? 'on' : ''} onClick={() => setRating(i)} aria-label={`${i} star`}>
            <Icon name="star" size={32} fill={rating >= i} />
          </button>
        ))}
      </div>
      <label className="form-field">
        <span>Your review</span>
        <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well? Anything to improve?" />
      </label>
      {err && <small className="field-error">{err}</small>}
    </Modal>
  );
}

/* ---------------- Saved ---------------- */
function Saved({ user }) {
  const { db } = useApp();
  const workers = (user.savedWorkers || []).map((id) => db.getWorker(id)).filter(Boolean);
  return (
    <>
      <h1 className="dash-title">Saved helpers</h1>
      {workers.length ? (
        <div className="workers-grid two">
          {workers.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon="heart" title="No saved helpers yet" text="Tap the heart on any helper to keep them here for quick booking." action={<Link className="btn btn-primary" to="/helpers">Browse helpers</Link>} />
        </div>
      )}
    </>
  );
}

/* ---------------- Profile ---------------- */
function Profile({ user }) {
  const { db, toast } = useApp();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone, location: user.location, address: user.address || '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [errors, setErrors] = useState({});

  const save = (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 3) er.name = 'Enter your full name.';
    if (!isValidEmail(form.email)) er.email = 'Enter a valid email.';
    if (!isValidPhone(form.phone)) er.phone = 'Enter a 10-digit mobile number.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const res = db.updateUser(user.id, { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
    if (res?.error) {
      setErrors({ email: res.error });
      return;
    }
    toast('Profile updated.', 'success');
  };

  const changePw = (e) => {
    e.preventDefault();
    if (pw.current !== user.password) {
      setErrors({ pw: 'Current password is incorrect.' });
      return;
    }
    if (pw.next.length < 6) {
      setErrors({ pw: 'New password must be at least 6 characters.' });
      return;
    }
    db.updateUser(user.id, { password: pw.next });
    setPw({ current: '', next: '' });
    setErrors({});
    toast('Password changed.', 'success');
  };

  return (
    <>
      <h1 className="dash-title">Profile</h1>
      <form className="card" onSubmit={save} noValidate>
        <h3>Personal details</h3>
        <div className="form-grid">
          <label className={`form-field ${errors.name ? 'invalid' : ''}`}>
            <span>Full name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <small className="field-error">{errors.name}</small>}
          </label>
          <label className={`form-field ${errors.email ? 'invalid' : ''}`}>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>
          <label className={`form-field ${errors.phone ? 'invalid' : ''}`}>
            <span>Phone</span>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <small className="field-error">{errors.phone}</small>}
          </label>
          <label className="form-field">
            <span>Location</span>
            <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="form-field span-2">
            <span>Default service address</span>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Flat, building, street" />
          </label>
        </div>
        <button className="btn btn-primary">Save changes</button>
      </form>

      <form className="card" onSubmit={changePw} noValidate>
        <h3>Change password</h3>
        <div className="form-grid">
          <label className="form-field">
            <span>Current password</span>
            <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
          </label>
          <label className="form-field">
            <span>New password</span>
            <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </label>
        </div>
        {errors.pw && <div className="alert alert-error">{errors.pw}</div>}
        <button className="btn btn-ghost">Update password</button>
      </form>
    </>
  );
}
