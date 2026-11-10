import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { EVENTS, LANGUAGES, LOCATIONS } from '../../data/constants.js';
import {
  availabilitySummary,
  formatDate,
  formatINR,
  formatRange,
  greeting,
  isValidPhone,
  resizeImage,
  serviceName,
  serviceNames,
  todayISO,
  weeklyHours
} from '../../utils/helpers.js';
import DashboardLayout, { StatCard } from '../../components/DashboardLayout.jsx';
import NotificationList from '../../components/NotificationList.jsx';
import EarningsChart from '../../components/EarningsChart.jsx';
import AngularAvailability from '../../components/AngularAvailability.jsx';
import Icon from '../../components/Icon.jsx';
import { Avatar, EmptyState, Modal, Stars, StatusBadge } from '../../components/Common.jsx';

export default function WorkerDashboard() {
  const { tab = 'overview' } = useParams();
  const { user, db, toast } = useApp();
  const worker = db.getWorker(user.workerId);

  // AngularJS -> React communication: the Angular module dispatches this event after saving.
  useEffect(() => {
    const onUpdated = (e) => {
      if (e.detail?.workerId === user.workerId) toast('Availability saved. Customers now see your new schedule.', 'success');
    };
    window.addEventListener(EVENTS.availabilityUpdated, onUpdated);
    return () => window.removeEventListener(EVENTS.availabilityUpdated, onUpdated);
  }, [user.workerId, toast]);

  if (!worker) {
    return (
      <div className="page container">
        <EmptyState icon="info" title="Helper profile missing" text="Your helper profile could not be found. Try resetting the demo data from the footer." />
      </div>
    );
  }

  const bookings = db.getWorkerBookings(worker.id);
  const pending = bookings.filter((b) => b.status === 'pending');
  const unread = db.getNotifications(user.id).filter((n) => !n.read).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'requests', label: 'Booking requests', icon: 'inbox', count: pending.length },
    { id: 'availability', label: 'Availability & services', icon: 'clock' },
    { id: 'reviews', label: 'Reviews', icon: 'star' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', count: unread },
    { id: 'profile', label: 'Profile', icon: 'settings' }
  ];
  if (!tabs.some((t) => t.id === tab)) return <Navigate to="/worker" replace />;

  return (
    <DashboardLayout base="/worker" tabs={tabs} user={user} photo={worker.photo} subtitle={`Helper · ${worker.location}`}>
      {tab === 'overview' && <Overview worker={worker} bookings={bookings} user={user} />}
      {tab === 'requests' && <Requests bookings={bookings} />}
      {tab === 'availability' && (
        <>
          <div className="info-strip">
            <Icon name="info" size={18} />
            <span>
              This section is an isolated <b>AngularJS 1.x</b> module. It saves to shared localStorage and notifies the React app with a browser event.{' '}
              <Link to={`/workers/${worker.id}`}>Preview your public profile</Link>
            </span>
          </div>
          <div className="card angular-card">
            <AngularAvailability workerId={worker.id} />
          </div>
        </>
      )}
      {tab === 'reviews' && <Reviews worker={worker} />}
      {tab === 'notifications' && (
        <>
          <h1 className="dash-title">Notifications</h1>
          <div className="card">
            <NotificationList userId={user.id} />
          </div>
        </>
      )}
      {tab === 'profile' && <Profile worker={worker} user={user} />}
    </DashboardLayout>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ worker, bookings, user }) {
  const completed = bookings.filter((b) => b.status === 'completed');
  const pending = bookings.filter((b) => b.status === 'pending');
  const accepted = bookings.filter((b) => b.status === 'accepted');
  const earned = completed.reduce((s, b) => s + b.total, 0);
  const expected = accepted.reduce((s, b) => s + b.total, 0);
  const upcomingJobs = accepted.filter((b) => b.date >= todayISO()).sort((a, b) => (a.date === b.date ? a.startTime - b.startTime : a.date < b.date ? -1 : 1));
  const schedule = availabilitySummary(worker);

  return (
    <>
      <div className="welcome worker">
        <div>
          <p className="kicker light">{greeting()},</p>
          <h1>{worker.name.split(' ')[0]} 👋</h1>
          <p>{pending.length ? `You have ${pending.length} new booking request${pending.length > 1 ? 's' : ''} waiting for a reply.` : 'No new requests right now. Keep your availability up to date to get more bookings.'}</p>
        </div>
        <Link to={pending.length ? '/worker/requests' : '/worker/availability'} className="btn btn-accent">
          {pending.length ? 'Review requests' : 'Update availability'}
        </Link>
      </div>

      <div className="stats-row">
        <StatCard icon="calendar" label="Total bookings" value={bookings.length} />
        <StatCard icon="inbox" label="Pending requests" value={pending.length} tone="orange" />
        <StatCard icon="check" label="Completed jobs" value={completed.length} tone="teal" />
        <StatCard icon="wallet" label="Estimated earnings" value={formatINR(earned + expected)} hint={`${formatINR(expected)} confirmed upcoming`} tone="violet" />
      </div>

      <div className="dash-grid">
        <div className="card">
          <EarningsChart bookings={bookings} />
        </div>
        <div className="card">
          <div className="card-head">
            <h3>This week</h3>
            <Link to="/worker/availability" className="link">
              Edit
            </Link>
          </div>
          <ul className="schedule compact">
            {schedule.map((d) => (
              <li key={d.day} className={d.available ? '' : 'off'}>
                <b>{d.day.slice(0, 3)}</b>
                <span>{d.label}</span>
              </li>
            ))}
          </ul>
          <div className="mini-stats">
            <div>
              <small>Hourly rate</small>
              <b>{formatINR(worker.hourlyRate)}</b>
            </div>
            <div>
              <small>Hours / week</small>
              <b>{weeklyHours(worker)} h</b>
            </div>
            <div>
              <small>Rating</small>
              <b>{worker.reviewCount ? `${Number(worker.rating).toFixed(1)}★` : 'New'}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Upcoming confirmed jobs</h3>
            <Link to="/worker/requests" className="link">
              All requests
            </Link>
          </div>
          {upcomingJobs.length ? (
            <div className="stack">
              {upcomingJobs.slice(0, 4).map((b) => (
                <div key={b.id} className="booking-row">
                  <Avatar name={b.customerName} size={44} />
                  <div className="grow">
                    <b>{b.customerName}</b>
                    <small>
                      {formatDate(b.date, { year: false })} · {formatRange(b.startTime, b.startTime + b.duration)} · {serviceNames(b.services)}
                    </small>
                  </div>
                  <b>{formatINR(b.total)}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="calendar" title="No confirmed jobs yet" text="Accepted bookings will show up here." />
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Notifications</h3>
            <Link to="/worker/notifications" className="link">
              See all
            </Link>
          </div>
          <NotificationList userId={user.id} limit={4} compact />
        </div>
      </div>
    </>
  );
}

/* ---------------- Requests ---------------- */
const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'closed', label: 'Declined / cancelled' },
  { id: 'all', label: 'All' }
];

function Requests({ bookings }) {
  const { db, toast } = useApp();
  const [filter, setFilter] = useState('pending');
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  const list = bookings
    .filter((b) => (filter === 'all' ? true : filter === 'closed' ? b.status === 'rejected' || b.status === 'cancelled' : b.status === filter))
    .sort((a, b) => (filter === 'completed' || filter === 'all' ? (a.date < b.date ? 1 : -1) : a.date < b.date ? -1 : 1));

  const counts = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    accepted: bookings.filter((b) => b.status === 'accepted').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    closed: bookings.filter((b) => b.status === 'rejected' || b.status === 'cancelled').length,
    all: bookings.length
  };

  const act = (b, status) => {
    db.updateBookingStatus(b.id, status);
    const msg = { accepted: `Accepted ${b.customerName}'s booking. They've been notified.`, rejected: `Declined booking ${b.id}.`, completed: `Marked ${b.id} as completed.` };
    toast(msg[status], status === 'rejected' ? 'info' : 'success');
    setViewing(null);
    setRejecting(null);
  };

  return (
    <>
      <h1 className="dash-title">Booking requests</h1>
      <div className="tabs-scroll mb-16">
        {FILTERS.map((f) => (
          <button key={f.id} className={`tab-pill ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label} <em>{counts[f.id]}</em>
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="stack">
          {list.map((b) => (
            <article key={b.id} className={`card request-card status-${b.status}`}>
              <div className="bc-head">
                <div className="row">
                  <Avatar name={b.customerName} size={48} />
                  <div>
                    <b>{b.customerName}</b>
                    <small className="muted block">
                      <Icon name="pin" size={12} /> {b.customerLocation} · {b.id}
                    </small>
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
                  <small>Time &amp; duration</small>
                  <b>
                    {formatRange(b.startTime, b.startTime + b.duration)} · {b.duration} hrs
                  </b>
                </div>
                <div>
                  <small>Requested services</small>
                  <div className="chips">
                    {b.services.map((s) => (
                      <span key={s} className="chip">
                        {serviceName(s)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <small>Estimated payment</small>
                  <b className="money">{formatINR(b.total)}</b>
                </div>
              </div>
              <div className="bc-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setViewing(b)}>
                  <Icon name="user" size={16} /> Customer details
                </button>
                {b.status === 'pending' && (
                  <>
                    <button className="btn btn-ghost btn-sm danger-text" onClick={() => setRejecting(b)}>
                      <Icon name="x" size={16} /> Reject
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, 'accepted')}>
                      <Icon name="check" size={16} /> Accept
                    </button>
                  </>
                )}
                {b.status === 'accepted' && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(b, 'completed')}>
                    <Icon name="check" size={16} /> Mark completed
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon="inbox" title={`No ${FILTERS.find((f) => f.id === filter).label.toLowerCase()} bookings`} text="New requests from customers will appear here." />
        </div>
      )}

      <Modal
        open={!!viewing}
        title="Customer details"
        onClose={() => setViewing(null)}
        footer={
          viewing?.status === 'pending' ? (
            <>
              <button
                className="btn btn-ghost danger-text"
                onClick={() => {
                  setRejecting(viewing);
                  setViewing(null);
                }}
              >
                Reject
              </button>
              <button className="btn btn-primary" onClick={() => act(viewing, 'accepted')}>
                Accept booking
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setViewing(null)}>
              Close
            </button>
          )
        }
      >
        {viewing && (
          <div className="customer-details">
            <div className="row mb-16">
              <Avatar name={viewing.customerName} size={56} />
              <div>
                <b className="lg">{viewing.customerName}</b>
                <div>
                  <StatusBadge status={viewing.status} />
                </div>
              </div>
            </div>
            <dl className="dl-grid">
              <dt>
                <Icon name="phone" size={16} /> Phone
              </dt>
              <dd>
                <a href={`tel:${viewing.customerPhone}`}>+91 {viewing.customerPhone}</a>
              </dd>
              <dt>
                <Icon name="pin" size={16} /> Address
              </dt>
              <dd>{viewing.address}</dd>
              <dt>
                <Icon name="calendar" size={16} /> When
              </dt>
              <dd>
                {formatDate(viewing.date)}, {formatRange(viewing.startTime, viewing.startTime + viewing.duration)}
              </dd>
              <dt>
                <Icon name="list" size={16} /> Services
              </dt>
              <dd>{serviceNames(viewing.services)}</dd>
              <dt>
                <Icon name="wallet" size={16} /> Payment
              </dt>
              <dd>
                {formatINR(viewing.total)} ({formatINR(viewing.hourlyRate)} × {viewing.duration} hrs)
              </dd>
              {viewing.notes && (
                <>
                  <dt>
                    <Icon name="edit" size={16} /> Notes
                  </dt>
                  <dd>“{viewing.notes}”</dd>
                </>
              )}
            </dl>
          </div>
        )}
      </Modal>

      <Modal
        open={!!rejecting}
        title="Decline this booking?"
        onClose={() => setRejecting(null)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRejecting(null)}>
              Go back
            </button>
            <button className="btn btn-danger" onClick={() => act(rejecting, 'rejected')}>
              Decline booking
            </button>
          </>
        }
      >
        {rejecting && (
          <p>
            {rejecting.customerName} will be told you can't take this visit on {formatDate(rejecting.date)} and the slot will open up again.
          </p>
        )}
      </Modal>
    </>
  );
}

/* ---------------- Reviews ---------------- */
function Reviews({ worker }) {
  const { db } = useApp();
  const reviews = db.getReviews(worker.id);
  return (
    <>
      <h1 className="dash-title">Reviews</h1>
      <div className="card rating-hero">
        <div className="big-rating">
          <b>{worker.reviewCount ? Number(worker.rating).toFixed(1) : '–'}</b>
          <Stars value={worker.rating} size={18} />
          <small>{worker.reviewCount} total ratings</small>
        </div>
        <p className="muted">Helpers rated 4.5★ and above appear higher in search results and get up to 3× more bookings.</p>
      </div>
      {reviews.length ? (
        <ul className="reviews card">
          {reviews.map((r) => (
            <li key={r.id} className="review">
              <div className="row-between">
                <div className="row">
                  <Avatar name={r.customerName} size={36} />
                  <div>
                    <b>{r.customerName}</b>
                    <small className="muted block">{formatDate(r.date)}</small>
                  </div>
                </div>
                <Stars value={r.rating} />
              </div>
              <p>{r.comment}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card">
          <EmptyState icon="star" title="No reviews yet" text="Complete your first booking to start collecting reviews." />
        </div>
      )}
    </>
  );
}

/* ---------------- Profile ---------------- */
function Profile({ worker, user }) {
  const { db, toast } = useApp();
  const [form, setForm] = useState({
    name: worker.name,
    phone: worker.phone,
    location: worker.location,
    experience: worker.experience,
    bio: worker.bio,
    languages: worker.languages,
    photo: worker.photo
  });
  const [errors, setErrors] = useState({});

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const photo = await resizeImage(file);
      setForm((f) => ({ ...f, photo }));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const toggleLang = (l) => setForm((f) => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] }));

  const save = (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 3) er.name = 'Enter your full name.';
    if (!isValidPhone(form.phone)) er.phone = 'Enter a 10-digit mobile number.';
    const exp = Number(form.experience);
    if (Number.isNaN(exp) || exp < 0 || exp > 50) er.experience = 'Experience must be 0–50 years.';
    if (!form.languages.length) er.languages = 'Pick at least one language.';
    if (form.bio.trim().length < 20) er.bio = 'Write at least a sentence or two about yourself.';
    setErrors(er);
    if (Object.keys(er).length) return;
    db.updateWorker(worker.id, { ...form, name: form.name.trim(), experience: exp, bio: form.bio.trim() });
    db.updateUser(user.id, { name: form.name.trim(), phone: form.phone, location: form.location });
    toast('Profile updated. Customers see your changes right away.', 'success');
  };

  return (
    <>
      <div className="row-between wrap mb-16">
        <h1 className="dash-title">Profile</h1>
        <Link to={`/workers/${worker.id}`} className="btn btn-ghost btn-sm">
          <Icon name="eye" size={16} /> View public profile
        </Link>
      </div>
      <form className="card" onSubmit={save} noValidate>
        <div className="photo-upload">
          <Avatar src={form.photo} name={form.name} size={84} />
          <div>
            <label className="btn btn-ghost btn-sm file-btn">
              <Icon name="upload" size={16} /> Change photo
              <input type="file" accept="image/*" onChange={onPhoto} />
            </label>
            <small className="muted block">Services and hourly charge are managed under Availability &amp; services.</small>
          </div>
        </div>
        <div className="form-grid">
          <label className={`form-field ${errors.name ? 'invalid' : ''}`}>
            <span>Full name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <small className="field-error">{errors.name}</small>}
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
          <label className={`form-field ${errors.experience ? 'invalid' : ''}`}>
            <span>Experience (years)</span>
            <input type="number" min="0" max="50" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
            {errors.experience && <small className="field-error">{errors.experience}</small>}
          </label>
          <label className={`form-field span-2 ${errors.bio ? 'invalid' : ''}`}>
            <span>About you</span>
            <textarea rows="4" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            {errors.bio && <small className="field-error">{errors.bio}</small>}
          </label>
        </div>
        <fieldset className={`form-field ${errors.languages ? 'invalid' : ''}`}>
          <legend>Languages</legend>
          <div className="toggle-chips">
            {LANGUAGES.map((l) => (
              <button type="button" key={l} className={form.languages.includes(l) ? 'active' : ''} onClick={() => toggleLang(l)} aria-pressed={form.languages.includes(l)}>
                {l}
              </button>
            ))}
          </div>
          {errors.languages && <small className="field-error">{errors.languages}</small>}
        </fieldset>
        <button className="btn btn-primary">Save profile</button>
      </form>
    </>
  );
}
