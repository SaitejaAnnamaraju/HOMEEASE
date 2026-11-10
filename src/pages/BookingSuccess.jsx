import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatDate, formatINR, formatRange, serviceNames } from '../utils/helpers.js';
import Icon from '../components/Icon.jsx';
import { Avatar, StatusBadge } from '../components/Common.jsx';
import NotFound from './NotFound.jsx';

export default function BookingSuccess() {
  const { bookingId } = useParams();
  const { db, user } = useApp();
  const b = db.getBooking(bookingId);
  if (!b || b.customerId !== user.id) return <NotFound title="Booking not found" text="We couldn't find that booking on your account." />;

  return (
    <div className="page success-page">
      <div className="container narrow">
        <div className="card success-card">
          <div className="success-icon">
            <Icon name="check" size={36} strokeWidth={2.6} />
          </div>
          <h1>Booking requested!</h1>
          <p className="muted">
            We've sent your request to {b.workerName}. You'll get a notification as soon as they accept.
          </p>
          <div className="booking-id">
            <small>Booking ID</small>
            <b>{b.id}</b>
          </div>

          <div className="success-details">
            <div className="row">
              <Avatar src={b.workerPhoto} name={b.workerName} size={52} />
              <div>
                <b>{b.workerName}</b>
                <div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            </div>
            <dl>
              <div>
                <dt>Services</dt>
                <dd>{serviceNames(b.services)}</dd>
              </div>
              <div>
                <dt>When</dt>
                <dd>
                  {formatDate(b.date)}, {formatRange(b.startTime, b.startTime + b.duration)}
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{b.address}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  <b>{formatINR(b.total)}</b> <span className="muted">({formatINR(b.hourlyRate)} × {b.duration} hrs)</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="btn-row center">
            <Link to="/customer/bookings" className="btn btn-primary">
              View my bookings
            </Link>
            <Link to="/helpers" className="btn btn-ghost">
              Book another helper
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
