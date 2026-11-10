import Icon from './Icon.jsx';

export default function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-inner">
        <h2>
          Your Home,
          <br />
          Taken Care Of.
        </h2>
        <p>Trusted cooks, cleaners and caregivers, booked for exactly the hours you need.</p>
        <ul className="ticks light">
          <li>
            <Icon name="shield" size={18} /> Background-verified helpers
          </li>
          <li>
            <Icon name="clock" size={18} /> Book by the hour, bundle services
          </li>
          <li>
            <Icon name="star" size={18} /> Real ratings from real homes
          </li>
        </ul>
        <figure className="auth-quote">
          <blockquote>“Dinner, dishes and laundry done before we're home. HomeEase gave us our evenings back.”</blockquote>
          <figcaption>Ananya S., Gachibowli</figcaption>
        </figure>
      </div>
    </aside>
  );
}
