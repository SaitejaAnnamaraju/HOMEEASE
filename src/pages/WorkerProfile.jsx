import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatINR, formatDate, availabilitySummary, serviceName, weeklyHours, upcomingWorkingDates, getFreeSlots, formatHour } from '../utils/helpers.js';
import { SERVICE_MAP } from '../data/constants.js';
import Icon from '../components/Icon.jsx';
import { Avatar, Rating, Stars, EmptyState } from '../components/Common.jsx';
import NotFound from './NotFound.jsx';

export default function WorkerProfile() {
  const { id } = useParams();
  const { db, user, toast } = useApp();
  const navigate = useNavigate();
  const worker = db.getWorker(id);
  if (!worker) return <NotFound title="Helper not found" text="This profile may have been removed. Browse other helpers instead." />;

  const reviews = db.getReviews(worker.id);
  const schedule = availabilitySummary(worker);
  const saved = user?.savedWorkers?.includes(worker.id);
  const bookings = db.getBookings();
  const nextDates = upcomingWorkingDates(worker, 3)
    .map((d) => ({ date: d, slots: getFreeSlots(worker, d, bookings) }))
    .filter((d) => d.slots.length);
  const isSelf = user?.workerId === worker.id;

  const dist = [5, 4, 3, 2, 1].map((s) => {
    const n = reviews.filter((r) => Math.round(r.rating) === s).length;
    return { s, n, pct: reviews.length ? (n / reviews.length) * 100 : 0 };
  });

  const toggleSave = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/workers/${worker.id}`)}`);
      return;
    }
    if (user.role !== 'customer') {
      toast('Only customer accounts can save helpers.', 'info');
      return;
    }
    const now = db.toggleSavedWorker(user.id, worker.id);
    toast(now ? 'Saved to your favourites.' : 'Removed from favourites.', 'success');
  };

  return (
    <div className="page profile-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/helpers">Find Helpers</Link>
          <Icon name="chevron-right" size={14} />
          <span>{worker.name}</span>
        </nav>

        <div className="profile-layout">
          <div className="profile-main">
            <section className="card profile-header">
              <Avatar src={worker.photo} name={worker.name} size={132} className="profile-photo" />
              <div className="profile-id">
                <div className="row-wrap">
                  <h1>{worker.name}</h1>
                  {worker.verified ? (
                    <span className="badge badge-green">
                      <Icon name="shield" size={14} /> Background verified
                    </span>
                  ) : (
                    <span className="badge">Verification pending</span>
                  )}
                </div>
                <p className="muted">
                  <Icon name="pin" size={16} /> {worker.location}, Hyderabad
                </p>
                <div className="profile-stats">
                  <div>
                    <Rating value={worker.rating} count={worker.reviewCount} />
                    <small>Rating</small>
                  </div>
                  <div>
                    <b>{worker.experience} yrs</b>
                    <small>Experience</small>
                  </div>
                  <div>
                    <b>{worker.jobsDone || 0}</b>
                    <small>Jobs done</small>
                  </div>
                  <div>
                    <b>{weeklyHours(worker)} h</b>
                    <small>Free / week</small>
                  </div>
                </div>
              </div>
              <button className={`save-btn lg ${saved ? 'saved' : ''}`} onClick={toggleSave} aria-label={saved ? 'Remove from saved' : 'Save helper'} aria-pressed={!!saved}>
                <Icon name="heart" size={20} fill={saved} />
              </button>
            </section>

            <section className="card">
              <h2>About</h2>
              <p className="about">{worker.bio}</p>
              <div className="detail-grid">
                <div>
                  <Icon name="globe" size={18} />
                  <div>
                    <small>Languages</small>
                    <b>{worker.languages.join(', ')}</b>
                  </div>
                </div>
                <div>
                  <Icon name="award" size={18} />
                  <div>
                    <small>Experience</small>
                    <b>{worker.experience} years in household work</b>
                  </div>
                </div>
                <div>
                  <Icon name="user" size={18} />
                  <div>
                    <small>Gender</small>
                    <b>{worker.gender || 'Not specified'}</b>
                  </div>
                </div>
                <div>
                  <Icon name="rupee" size={18} />
                  <div>
                    <small>Hourly charge</small>
                    <b>{formatINR(worker.hourlyRate)} / hour, all services</b>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <h2>Services offered</h2>
              <div className="service-list">
                {worker.services.map((s) => (
                  <div key={s} className="service-item">
                    <span className="service-icon sm">
                      <Icon name={SERVICE_MAP[s]?.icon} size={18} />
                    </span>
                    <div>
                      <b>{serviceName(s)}</b>
                      <small>{SERVICE_MAP[s]?.desc}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2>Weekly availability</h2>
              <ul className="schedule">
                {schedule.map((d) => (
                  <li key={d.day} className={d.available ? '' : 'off'}>
                    <b>{d.day}</b>
                    <span>{d.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card" id="reviews">
              <h2>Ratings &amp; reviews</h2>
              <div className="rating-summary">
                <div className="big-rating">
                  <b>{worker.reviewCount ? Number(worker.rating).toFixed(1) : '–'}</b>
                  <Stars value={worker.rating} size={16} />
                  <small>{worker.reviewCount} ratings</small>
                </div>
                <div className="dist">
                  {dist.map((d) => (
                    <div key={d.s} className="dist-row">
                      <span>{d.s}★</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${d.pct}%` }} />
                      </div>
                      <small>{d.n}</small>
                    </div>
                  ))}
                </div>
              </div>
              {reviews.length ? (
                <ul className="reviews">
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
                <EmptyState icon="star" title="No reviews yet" text="Be the first to book and review this helper." />
              )}
            </section>
          </div>

          <aside className="profile-aside">
            <div className="card booking-box">
              <div className="price lg">
                <b>{formatINR(worker.hourlyRate)}</b>
                <span>/hour</span>
              </div>
              <p className="muted small">Pick any combination of {worker.name.split(' ')[0]}'s services in one visit.</p>
              {nextDates.length > 0 && (
                <div className="next-slots">
                  <small>Next available</small>
                  {nextDates.map((d) => (
                    <Link key={d.date} to={`/book/${worker.id}?date=${d.date}&time=${d.slots[0]}`} className="next-slot">
                      <span>{formatDate(d.date, { year: false })}</span>
                      <b>{formatHour(d.slots[0])}</b>
                    </Link>
                  ))}
                </div>
              )}
              {isSelf ? (
                <Link to="/worker/availability" className="btn btn-primary btn-block btn-lg">
                  Edit my availability
                </Link>
              ) : (
                <Link to={`/book/${worker.id}`} className="btn btn-primary btn-block btn-lg">
                  Book {worker.name.split(' ')[0]}
                </Link>
              )}
              <ul className="assurances">
                <li>
                  <Icon name="shield" size={16} /> ID &amp; address verified
                </li>
                <li>
                  <Icon name="refresh" size={16} /> Free cancellation before the visit
                </li>
                <li>
                  <Icon name="wallet" size={16} /> Pay after the job (demo)
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
      {!isSelf && (
        <div className="sticky-book only-mobile">
          <div className="price">
            <b>{formatINR(worker.hourlyRate)}</b>
            <span>/hour</span>
          </div>
          <Link to={`/book/${worker.id}`} className="btn btn-primary">
            Book now
          </Link>
        </div>
      )}
    </div>
  );
}
