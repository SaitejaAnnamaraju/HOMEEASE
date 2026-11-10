import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { SERVICE_MAP } from '../data/constants.js';
import {
  addDays,
  bookedHours,
  fitsDuration,
  formatDate,
  formatHour,
  formatINR,
  formatRange,
  getDaySlots,
  getFreeSlots,
  longestRunFrom,
  serviceName,
  toISODate,
  todayISO,
  upcomingWorkingDates,
  weekdayOf
} from '../utils/helpers.js';
import Icon from '../components/Icon.jsx';
import { Avatar, Rating } from '../components/Common.jsx';
import NotFound from './NotFound.jsx';

const DURATIONS = [1, 2, 3, 4, 5, 6];

export default function Booking() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { db, user, toast } = useApp();
  const navigate = useNavigate();
  const worker = db.getWorker(id);
  const bookings = db.getBookings();

  const initialDate = useMemo(() => {
    const p = params.get('date');
    if (p && p >= todayISO()) return p;
    if (!worker) return todayISO();
    // First date (within 30 days) that still has a free slot
    for (let i = 0; i < 30; i += 1) {
      const iso = toISODate(addDays(new Date(), i));
      if (getFreeSlots(worker, iso, bookings).length) return iso;
    }
    return upcomingWorkingDates(worker, 1)[0] || todayISO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [services, setServices] = useState(() => {
    const wanted = (params.get('services') || params.get('service') || '').split(',').filter(Boolean);
    return wanted.filter((s) => worker?.services.includes(s));
  });
  const [date, setDate] = useState(initialDate);
  const [duration, setDuration] = useState(2);
  const [start, setStart] = useState(() => (params.get('time') ? Number(params.get('time')) : null));
  const [address, setAddress] = useState(user?.address || (user ? `${user.location}, Hyderabad` : ''));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const daySlots = worker ? getDaySlots(worker, weekdayOf(date)) : [];
  const free = worker ? getFreeSlots(worker, date, bookings) : [];
  const taken = worker ? bookedHours(worker.id, date, bookings) : new Set();

  // Drop an invalid start time when date or duration changes
  useEffect(() => {
    if (start !== null && !fitsDuration(free, start, duration)) {
      const run = free.includes(start) ? longestRunFrom(free, start) : 0;
      if (run > 0 && run < duration) setDuration(run);
      else setStart(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, duration, worker?.id]);

  if (!worker) return <NotFound title="Helper not found" text="We couldn't find that helper. Pick someone else to book." />;

  const dates = Array.from({ length: 14 }, (_, i) => {
    const iso = toISODate(addDays(new Date(), i));
    return { iso, free: getFreeSlots(worker, iso, bookings).length };
  });

  const maxRun = start !== null ? longestRunFrom(free, start) : 6;
  const total = worker.hourlyRate * duration;
  const ready = services.length > 0 && start !== null && fitsDuration(free, start, duration) && address.trim().length > 4;
  const stepDone = [services.length > 0, !!date && free.length > 0, start !== null, start !== null && fitsDuration(free, start, duration)];

  const toggleService = (s) => setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const confirm = () => {
    setError('');
    if (!services.length) return setError('Choose at least one service.');
    if (start === null) return setError('Choose a start time.');
    if (!fitsDuration(free, start, duration)) return setError(`${worker.name.split(' ')[0]} isn't free for ${duration} hours from ${formatHour(start)}. Shorten the duration or pick another time.`);
    if (address.trim().length < 5) return setError('Enter the address where the helper should come.');
    setSubmitting(true);
    const res = db.createBooking({ customer: user, worker, services, date, startTime: start, duration, notes, address: address.trim() });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    toast(`Booking ${res.booking.id} requested!`, 'success');
    navigate(`/booking/success/${res.booking.id}`);
  };

  return (
    <div className="page booking-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/helpers">Find Helpers</Link>
          <Icon name="chevron-right" size={14} />
          <Link to={`/workers/${worker.id}`}>{worker.name}</Link>
          <Icon name="chevron-right" size={14} />
          <span>Book</span>
        </nav>
        <h1 className="page-title">Book {worker.name}</h1>

        <ol className="stepper" aria-label="Booking progress">
          {['Services', 'Date', 'Time', 'Duration', 'Confirm'].map((s, i) => (
            <li key={s} className={stepDone[i] || (i === 4 && ready) ? 'done' : ''}>
              <span>{stepDone[i] || (i === 4 && ready) ? <Icon name="check" size={14} strokeWidth={2.6} /> : i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <div className="booking-layout">
          <div className="booking-steps">
            {/* 1. Worker */}
            <section className="card selected-worker">
              <Avatar src={worker.photo} name={worker.name} size={64} />
              <div>
                <b>{worker.name}</b>
                <p className="muted small">
                  <Icon name="pin" size={14} /> {worker.location} · {worker.experience} yrs exp
                </p>
                <Rating value={worker.rating} count={worker.reviewCount} />
              </div>
              <Link to="/helpers" className="btn btn-ghost btn-sm">
                Change helper
              </Link>
            </section>

            {/* 2. Services */}
            <section className="card">
              <h2>
                <span className="step-badge">1</span> Select services
              </h2>
              <p className="muted small">Choose one or more. The hourly price stays the same however many you pick.</p>
              <div className="service-picker">
                {worker.services.map((s) => {
                  const on = services.includes(s);
                  return (
                    <button key={s} type="button" className={`service-option ${on ? 'active' : ''}`} onClick={() => toggleService(s)} aria-pressed={on}>
                      <span className="service-icon sm">
                        <Icon name={SERVICE_MAP[s]?.icon} size={18} />
                      </span>
                      <span>
                        <b>{serviceName(s)}</b>
                        <small>{SERVICE_MAP[s]?.desc}</small>
                      </span>
                      <span className="checkbox">{on && <Icon name="check" size={14} strokeWidth={2.8} />}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. Date */}
            <section className="card">
              <h2>
                <span className="step-badge">2</span> Select date
              </h2>
              <div className="date-strip" role="listbox" aria-label="Choose a date">
                {dates.map((d) => {
                  const dt = new Date(d.iso + 'T00:00');
                  return (
                    <button
                      key={d.iso}
                      role="option"
                      aria-selected={date === d.iso}
                      className={`date-chip ${date === d.iso ? 'active' : ''} ${d.free ? '' : 'none'}`}
                      onClick={() => setDate(d.iso)}
                    >
                      <small>{dt.toLocaleDateString('en-IN', { weekday: 'short' })}</small>
                      <b>{dt.getDate()}</b>
                      <small>{d.free ? `${d.free} slot${d.free > 1 ? 's' : ''}` : 'Off'}</small>
                    </button>
                  );
                })}
              </div>
              <label className="form-field inline">
                <span>Or pick another date</span>
                <input type="date" min={todayISO()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
              </label>
            </section>

            {/* 4. Time */}
            <section className="card">
              <h2>
                <span className="step-badge">3</span> Select a start time
              </h2>
              <p className="muted small">
                {formatDate(date)} ·{' '}
                {daySlots.length ? `${worker.name.split(' ')[0]} works ${formatRange(daySlots[0], daySlots[daySlots.length - 1] + 1)}` : `${worker.name.split(' ')[0]} doesn't work on ${weekdayOf(date)}s`}
              </p>
              {daySlots.length ? (
                <div className="slot-grid">
                  {daySlots.map((h) => {
                    const isBooked = taken.has(h);
                    const isFree = free.includes(h);
                    const fits = isFree && fitsDuration(free, h, duration);
                    return (
                      <button
                        key={h}
                        type="button"
                        className={`slot ${start === h ? 'active' : ''} ${isBooked ? 'booked' : ''}`}
                        disabled={!isFree}
                        onClick={() => {
                          setStart(h);
                          if (!fits) setDuration(longestRunFrom(free, h));
                        }}
                        title={isBooked ? 'Already booked' : !isFree ? 'Time has passed' : fits ? '' : `Only ${longestRunFrom(free, h)}h free from here`}
                      >
                        {formatHour(h)}
                        {isBooked && <small>Booked</small>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-info">
                  Not available on this day. Try one of the highlighted dates above.
                </div>
              )}
              {daySlots.length > 0 && free.length === 0 && <div className="alert alert-info mt-12">All slots on this day are taken. Please choose another date.</div>}
            </section>

            {/* 5. Duration */}
            <section className="card">
              <h2>
                <span className="step-badge">4</span> Select duration
              </h2>
              <div className="pill-group lg">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" className={duration === d ? 'active' : ''} disabled={start !== null && d > maxRun} onClick={() => setDuration(d)}>
                    {d} hr{d > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              {start !== null && <p className="muted small mt-8">Visit runs {formatRange(start, start + duration)}.</p>}
            </section>

            <section className="card">
              <h2>
                <span className="step-badge">5</span> Address &amp; notes
              </h2>
              <div className="form-grid one">
                <label className="form-field">
                  <span>Service address</span>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat, building, street, area" />
                </label>
                <label className="form-field">
                  <span>Notes for the helper (optional)</span>
                  <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Dinner for 4, less spicy. Washing machine is on the balcony." />
                </label>
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="booking-summary">
            <div className="card summary-card">
              <h3>Booking summary</h3>
              <dl>
                <div>
                  <dt>Helper</dt>
                  <dd>{worker.name}</dd>
                </div>
                <div>
                  <dt>Services</dt>
                  <dd>{services.length ? services.map(serviceName).join(', ') : <span className="muted">None selected</span>}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{formatDate(date)}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{start !== null ? formatRange(start, start + duration) : <span className="muted">Choose a time</span>}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>
                    {duration} hour{duration > 1 ? 's' : ''}
                  </dd>
                </div>
              </dl>
              <div className="calc">
                <div>
                  <span>Hourly price</span>
                  <span>{formatINR(worker.hourlyRate)}</span>
                </div>
                <div>
                  <span>Duration</span>
                  <span>× {duration}</span>
                </div>
                <div className="calc-total">
                  <span>Total</span>
                  <b>{formatINR(total)}</b>
                </div>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn btn-primary btn-block btn-lg" onClick={confirm} disabled={submitting}>
                Confirm booking
              </button>
              <p className="muted tiny center">Demo only — no payment is taken. Pay your helper after the visit.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
