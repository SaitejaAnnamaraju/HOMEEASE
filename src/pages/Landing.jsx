import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { SERVICES, LOCATIONS, HOURS, DEMO } from '../data/constants.js';
import { formatHour, todayISO, toISODate, addDays } from '../utils/helpers.js';
import Icon from '../components/Icon.jsx';
import WorkerCard from '../components/WorkerCard.jsx';
import { Avatar } from '../components/Common.jsx';

const TESTIMONIALS = [
  {
    name: 'Ananya & Karthik',
    role: 'Working couple, Gachibowli',
    photo: 'https://randomuser.me/api/portraits/women/26.jpg',
    text: 'We book Lakshmi from 5 to 7 PM on weekdays. She cooks dinner, does the dishes and runs a load of laundry — we come home to a calm house.'
  },
  {
    name: 'Rajesh Menon',
    role: 'Son & caregiver, Miyapur',
    photo: 'https://randomuser.me/api/portraits/men/46.jpg',
    text: 'Finding someone patient for my father was hard. Srinivas has been with us for months now. The verified profiles gave us real peace of mind.'
  },
  {
    name: 'Sana Qureshi',
    role: 'New mom, Banjara Hills',
    photo: 'https://randomuser.me/api/portraits/women/33.jpg',
    text: 'I love that I can pick exactly the hours I need. Comparing prices and reviews side by side took the guesswork out of it.'
  }
];

const STEPS = [
  { icon: 'search', title: 'Search your area', text: 'Tell us where, when and what you need. We show helpers who are free in that slot.' },
  { icon: 'users', title: 'Compare profiles', text: 'Check experience, reviews, languages and hourly prices side by side.' },
  { icon: 'calendar', title: 'Book by the hour', text: 'Pick several services for one visit — cooking, cleaning and laundry in a single booking.' },
  { icon: 'shield', title: 'Relax at home', text: 'Your helper confirms, arrives on time, and you rate the visit afterwards.' }
];

export default function Landing() {
  const { db, user, login, toast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ location: '', date: toISODate(addDays(new Date(), 1)), time: '17', service: '' });

  const workers = db.getWorkers();
  const featured = [...workers].filter((w) => w.reviewCount).sort((a, b) => b.rating - a.rating).slice(0, 4);
  const hero = workers.find((w) => w.id === 'w1') || workers[0];

  const search = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => v && p.set(k, v));
    navigate(`/helpers?${p.toString()}`);
  };

  const demo = (kind) => {
    const res = login(DEMO[kind].email, DEMO[kind].password);
    if (res.error) {
      toast('Demo account missing — resetting demo data.', 'info');
      db.resetDemoData();
      login(DEMO[kind].email, DEMO[kind].password);
    }
    toast(kind === 'customer' ? 'Logged in as demo customer Ananya.' : 'Logged in as demo helper Lakshmi.', 'success');
    navigate(kind === 'customer' ? '/customer' : '/worker');
  };

  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy reveal">
            <span className="eyebrow">
              <Icon name="shield" size={16} /> 1,200+ verified helpers across Hyderabad
            </span>
            <h1>
              Your Home,
              <br />
              <span className="accent">Taken Care Of.</span>
            </h1>
            <p className="lead">
              Book a trusted cook, cleaner or caregiver for exactly the hours you need — and bundle several chores into a
              single visit.
            </p>

            <form className="search-card" onSubmit={search}>
              <label className="field">
                <span>
                  <Icon name="pin" size={16} /> Location
                </span>
                <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                  <option value="">All areas</option>
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>
                  <Icon name="calendar" size={16} /> Date
                </span>
                <input type="date" min={todayISO()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
              <label className="field">
                <span>
                  <Icon name="clock" size={16} /> Time
                </span>
                <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
                  <option value="">Any time</option>
                  {HOURS.slice(0, -1).map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>
                  <Icon name="sparkles" size={16} /> Service
                </span>
                <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                  <option value="">All services</option>
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-accent btn-lg search-btn" type="submit">
                <Icon name="search" size={18} /> Find Helpers
              </button>
            </form>

            <div className="hero-trust">
              <div className="avatars">
                {workers.slice(1, 5).map((w) => (
                  <Avatar key={w.id} src={w.photo} name={w.name} size={36} />
                ))}
              </div>
              <p>
                <b>4.8/5</b> average rating from <b>18,000+</b> visits
              </p>
            </div>
          </div>

          <div className="hero-visual reveal delay-1" aria-hidden="true">
            <div className="hero-blob" />
            {hero && (
              <div className="hero-card hero-main-card">
                <Avatar src={hero.photo} name={hero.name} size={200} className="hero-photo" />
                <div className="hero-card-body">
                  <div className="row-between">
                    <b>{hero.name}</b>
                    <span className="rating">
                      <Icon name="star" size={14} fill /> {hero.rating}
                    </span>
                  </div>
                  <small>Cooking · Cleaning · Laundry</small>
                  <div className="row-between mt-8">
                    <span className="price-tag">₹{hero.hourlyRate}/hr</span>
                    <span className="mini-badge">
                      <Icon name="shield" size={12} /> Verified
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="hero-float f1">
              <span className="float-icon green">
                <Icon name="check" size={16} strokeWidth={2.6} />
              </span>
              <div>
                <b>Booking confirmed</b>
                <small>Today · 5 PM – 7 PM</small>
              </div>
            </div>
            <div className="hero-float f2">
              <span className="float-icon orange">
                <Icon name="chef" size={16} />
              </span>
              <div>
                <b>3 services, 1 visit</b>
                <small>₹300 for 2 hours</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section" id="services">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Popular services</span>
            <h2>Help for every corner of your home</h2>
            <p>Pick one service or combine several in a single booking.</p>
          </div>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <Link key={s.id} to={`/helpers?service=${s.id}`} className="service-card" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="service-icon">
                  <Icon name={s.icon} size={24} />
                </span>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
                <span className="from">
                  from <b>₹{s.from}/hr</b> <Icon name="arrow-right" size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how" id="how">
        <div className="container">
          <div className="section-head">
            <span className="kicker">How it works</span>
            <h2>From search to sparkling in four steps</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">{i + 1}</span>
                <span className="step-icon">
                  <Icon name={s.icon} size={22} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="example-card">
            <div>
              <span className="kicker">Example</span>
              <h3>A working couple needs help between 5 PM and 7 PM</h3>
              <p>
                They book one helper for two hours to handle cooking, cleaning and laundry. At ₹150/hour, the visit costs
                ₹300 — one booking, one helper, three chores done.
              </p>
            </div>
            <div className="example-calc">
              <div>
                <small>Hourly price</small>
                <b>₹150</b>
              </div>
              <span>×</span>
              <div>
                <small>Duration</small>
                <b>2 hrs</b>
              </div>
              <span>=</span>
              <div className="total">
                <small>Total</small>
                <b>₹300</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="section">
        <div className="container">
          <div className="section-head row">
            <div>
              <span className="kicker">Featured helpers</span>
              <h2>Top-rated near you</h2>
            </div>
            <Link to="/helpers" className="btn btn-ghost">
              See all helpers <Icon name="arrow-right" size={16} />
            </Link>
          </div>
          <div className="workers-grid">
            {featured.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-band">
        <div className="container stats-grid">
          <div>
            <b>1,200+</b>
            <span>Verified helpers</span>
          </div>
          <div>
            <b>18k+</b>
            <span>Visits completed</span>
          </div>
          <div>
            <b>10</b>
            <span>Household services</span>
          </div>
          <div>
            <b>4.8★</b>
            <span>Average rating</span>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Testimonials</span>
            <h2>Homes that feel lighter</h2>
          </div>
          <div className="testimonials">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="testimonial">
                <Icon name="quote" size={28} className="quote" />
                <blockquote>{t.text}</blockquote>
                <figcaption>
                  <Avatar src={t.photo} name={t.name} size={44} />
                  <div>
                    <b>{t.name}</b>
                    <small>{t.role}</small>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* BECOME A WORKER */}
      <section className="section">
        <div className="container">
          <div className="become">
            <div className="become-copy">
              <span className="kicker light">For helpers</span>
              <h2>Earn on your own schedule</h2>
              <p>
                Set your hourly rate, choose the services you offer and the hours you're free. Accept only the bookings
                that suit you.
              </p>
              <ul className="ticks">
                <li>
                  <Icon name="check" size={18} /> Keep 100% of your hourly charge
                </li>
                <li>
                  <Icon name="check" size={18} /> Weekly availability you control
                </li>
                <li>
                  <Icon name="check" size={18} /> Reviews that grow your income
                </li>
              </ul>
              <div className="btn-row">
                <Link to="/register?role=worker" className="btn btn-accent btn-lg">
                  Become a Helper
                </Link>
                {!user && (
                  <button className="btn btn-outline-light btn-lg" onClick={() => demo('worker')}>
                    Try the helper dashboard
                  </button>
                )}
              </div>
            </div>
            <div className="become-stats">
              <div>
                <small>Average helper earns</small>
                <b>₹18,400</b>
                <span>per month, part-time</span>
              </div>
              <div>
                <small>Typical hourly rate</small>
                <b>₹120–₹240</b>
                <span>you set your own</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      {!user && (
        <section className="section pt-0">
          <div className="container">
            <div className="demo-band">
              <div>
                <h3>Explore the demo in one click</h3>
                <p>Jump straight into a ready-made dashboard with sample bookings. No sign-up needed.</p>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => demo('customer')}>
                  <Icon name="user" size={18} /> Demo Customer
                </button>
                <button className="btn btn-dark" onClick={() => demo('worker')}>
                  <Icon name="briefcase" size={18} /> Demo Worker
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
