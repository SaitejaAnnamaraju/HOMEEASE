import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { SERVICES, LOCATIONS, DAYS, HOURS } from '../data/constants.js';
import { formatHour, formatDate, weekdayOf, getDaySlots, getFreeSlots, todayISO } from '../utils/helpers.js';
import WorkerCard from '../components/WorkerCard.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState } from '../components/Common.jsx';

const SORTS = {
  recommended: { label: 'Recommended', fn: (a, b) => b.rating * Math.log(b.reviewCount + 2) - a.rating * Math.log(a.reviewCount + 2) },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.hourlyRate - b.hourlyRate },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.hourlyRate - a.hourlyRate },
  rating: { label: 'Highest rated', fn: (a, b) => b.rating - a.rating },
  experience: { label: 'Most experienced', fn: (a, b) => b.experience - a.experience }
};

const PERIODS = {
  morning: { label: 'Morning (before 12 PM)', test: (h) => h < 12 },
  afternoon: { label: 'Afternoon (12–5 PM)', test: (h) => h >= 12 && h < 17 },
  evening: { label: 'Evening (after 5 PM)', test: (h) => h >= 17 }
};

export default function FindHelpers() {
  const { db, version } = useApp();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Multiple skills: ?services=cooking,cleaning  (legacy ?service=cooking still works)
  const skills = (params.get('services') || params.get('service') || '')
    .split(',')
    .filter((s) => SERVICES.some((x) => x.id === s));
  const match = params.get('match') === 'any' ? 'any' : 'all';

  const f = {
    q: params.get('q') || '',
    skills,
    match,
    location: params.get('location') || '',
    maxPrice: Number(params.get('maxPrice') || 300),
    experience: Number(params.get('experience') || 0),
    rating: Number(params.get('rating') || 0),
    date: params.get('date') || '',
    day: params.get('day') || '',
    time: params.get('time') || '',
    period: params.get('period') || '',
    sort: params.get('sort') || 'recommended'
  };

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined || (k === 'maxPrice' && Number(v) >= 300) || (k === 'sort' && v === 'recommended') || ((k === 'experience' || k === 'rating') && Number(v) === 0)) next.delete(k);
      else next.set(k, v);
    });
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const setSkills = (list) => update({ services: list.join(','), service: '', match: list.length > 1 && match === 'any' ? 'any' : '' });
  const toggleSkill = (id) => setSkills(skills.includes(id) ? skills.filter((s) => s !== id) : [...skills, id]);

  const workers = db.getWorkers();
  const bookings = db.getBookings();

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const dayName = f.date ? weekdayOf(f.date) : f.day;
    return workers
      .filter((w) => {
        if (q && !(`${w.name} ${w.location} ${w.services.join(' ')} ${w.languages.join(' ')}`.toLowerCase().includes(q))) return false;
        if (f.skills.length) {
          const ok = f.match === 'any' ? f.skills.some((s) => w.services.includes(s)) : f.skills.every((s) => w.services.includes(s));
          if (!ok) return false;
        }
        if (f.location && w.location !== f.location) return false;
        if (w.hourlyRate > f.maxPrice) return false;
        if (w.experience < f.experience) return false;
        if (f.rating && (w.rating < f.rating || !w.reviewCount)) return false;
        if (dayName || f.time || f.period) {
          let slots;
          if (f.date) slots = getFreeSlots(w, f.date, bookings);
          else if (dayName) slots = getDaySlots(w, dayName);
          else slots = DAYS.flatMap((d) => getDaySlots(w, d));
          if (f.time) slots = slots.filter((h) => h === Number(f.time));
          if (f.period) slots = slots.filter(PERIODS[f.period].test);
          if (!slots.length) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // In "Has any" mode, helpers matching more of the selected skills come first
        if (f.skills.length > 1 && f.match === 'any') {
          const diff = f.skills.filter((s) => b.services.includes(s)).length - f.skills.filter((s) => a.services.includes(s)).length;
          if (diff) return diff;
        }
        return (SORTS[f.sort]?.fn || SORTS.recommended.fn)(a, b);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, version]);

  const bq = new URLSearchParams();
  if (f.date) bq.set('date', f.date);
  if (f.date && f.time) bq.set('time', f.time);
  if (f.skills.length) bq.set('services', f.skills.join(','));
  const bookQuery = bq.toString() ? `?${bq}` : '';

  const activeChips = [
    f.q && { k: 'q', label: `“${f.q}”` },
    ...f.skills.map((id) => ({ k: `skill:${id}`, label: SERVICES.find((s) => s.id === id)?.name, onRemove: () => toggleSkill(id) })),
    f.skills.length > 1 && { k: 'match', label: f.match === 'any' ? 'Any of these skills' : 'All of these skills', onRemove: () => update({ match: f.match === 'any' ? '' : 'any' }) },
    f.location && { k: 'location', label: f.location },
    f.maxPrice < 300 && { k: 'maxPrice', label: `Up to ₹${f.maxPrice}/hr` },
    f.experience > 0 && { k: 'experience', label: `${f.experience}+ yrs` },
    f.rating > 0 && { k: 'rating', label: `${f.rating}★ & up` },
    f.date && { k: 'date', label: formatDate(f.date) },
    f.day && !f.date && { k: 'day', label: f.day },
    f.time && { k: 'time', label: `Free at ${formatHour(f.time)}` },
    f.period && { k: 'period', label: PERIODS[f.period].label.split(' (')[0] }
  ].filter(Boolean);

  return (
    <div className="page find-page">
      <section className="page-hero compact">
        <div className="container">
          <h1>Find helpers</h1>
          <p>Compare verified helpers by price, experience, rating and when they're free.</p>
          <div className="searchbar">
            <Icon name="search" size={20} />
            <input
              type="search"
              placeholder="Search by name, service, area or language…"
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              aria-label="Search helpers"
            />
          </div>
        </div>
      </section>

      <div className="container find-layout">
        <aside className={`filters ${showFilters ? 'open' : ''}`} aria-label="Filters">
          <div className="filters-head">
            <h3>
              <Icon name="filter" size={18} /> Filters
            </h3>
            <button className="link-btn" onClick={clearAll}>
              Clear all
            </button>
            <button className="icon-btn only-mobile" onClick={() => setShowFilters(false)} aria-label="Close filters">
              <Icon name="x" />
            </button>
          </div>

          <div className="form-field">
            <span className="row-between">
              Skills &amp; services
              {skills.length > 0 && (
                <button type="button" className="link-btn" onClick={() => setSkills([])}>
                  Clear ({skills.length})
                </button>
              )}
            </span>
            <div className="toggle-chips skill-filter">
              {SERVICES.map((s) => {
                const on = skills.includes(s.id);
                return (
                  <button type="button" key={s.id} className={on ? 'active' : ''} onClick={() => toggleSkill(s.id)} aria-pressed={on}>
                    <Icon name={on ? 'check' : s.icon} size={14} strokeWidth={on ? 2.6 : 1.8} /> {s.name}
                  </button>
                );
              })}
            </div>
            {skills.length > 1 && (
              <div className="segmented sm match-toggle" role="radiogroup" aria-label="Skill matching">
                <button type="button" role="radio" aria-checked={match === 'all'} className={match === 'all' ? 'active' : ''} onClick={() => update({ match: '' })}>
                  Has all
                </button>
                <button type="button" role="radio" aria-checked={match === 'any'} className={match === 'any' ? 'active' : ''} onClick={() => update({ match: 'any' })}>
                  Has any
                </button>
              </div>
            )}
            {skills.length > 1 && (
              <small className="muted">
                {match === 'all' ? 'Helpers who can do every selected task in one visit.' : 'Helpers who do at least one selected task.'}
              </small>
            )}
          </div>

          <label className="form-field">
            <span>Location</span>
            <select value={f.location} onChange={(e) => update({ location: e.target.value })}>
              <option value="">All areas</option>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="row-between">
              Max hourly price <b>{f.maxPrice >= 300 ? 'Any' : `₹${f.maxPrice}`}</b>
            </span>
            <input type="range" min="100" max="300" step="10" value={f.maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} />
            <span className="range-labels">
              <small>₹100</small>
              <small>₹300+</small>
            </span>
          </label>

          <div className="form-field">
            <span>Experience</span>
            <div className="pill-group">
              {[0, 3, 5, 10].map((n) => (
                <button key={n} className={f.experience === n ? 'active' : ''} onClick={() => update({ experience: n })}>
                  {n === 0 ? 'Any' : `${n}+ yrs`}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <span>Rating</span>
            <div className="pill-group">
              {[0, 4, 4.5, 4.8].map((n) => (
                <button key={n} className={f.rating === n ? 'active' : ''} onClick={() => update({ rating: n })}>
                  {n === 0 ? 'Any' : `${n}★+`}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h4>Availability</h4>
            <label className="form-field">
              <span>Specific date</span>
              <input type="date" min={todayISO()} value={f.date} onChange={(e) => update({ date: e.target.value, day: '' })} />
            </label>
            <label className="form-field">
              <span>or any…</span>
              <select value={f.day} disabled={!!f.date} onChange={(e) => update({ day: e.target.value })}>
                <option value="">Any day</option>
                {DAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Time of day</span>
              <select value={f.period} onChange={(e) => update({ period: e.target.value })}>
                <option value="">Any time</option>
                {Object.entries(PERIODS).map(([k, p]) => (
                  <option key={k} value={k}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Free at exactly</span>
              <select value={f.time} onChange={(e) => update({ time: e.target.value })}>
                <option value="">Any hour</option>
                {HOURS.slice(0, -1).map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="btn btn-primary btn-block only-mobile" onClick={() => setShowFilters(false)}>
            Show {results.length} helpers
          </button>
        </aside>

        <section className="results">
          <div className="results-bar">
            <p>
              <b>{results.length}</b> helper{results.length === 1 ? '' : 's'} found
            </p>
            <div className="results-tools">
              <button className="btn btn-ghost btn-sm only-mobile" onClick={() => setShowFilters(true)}>
                <Icon name="sliders" size={16} /> Filters {activeChips.length > 0 && `(${activeChips.length})`}
              </button>
              <label className="sort">
                <span className="hide-sm">Sort by</span>
                <select value={f.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort helpers">
                  {Object.entries(SORTS).map(([k, s]) => (
                    <option key={k} value={k}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-chips">
              {activeChips.map((c) => (
                <button key={c.k} className="chip removable" onClick={() => (c.onRemove ? c.onRemove() : update({ [c.k]: '' }))}>
                  {c.label} <Icon name="x" size={12} />
                </button>
              ))}
            </div>
          )}

          {results.length ? (
            <div className="workers-grid two">
              {results.map((w) => (
                <WorkerCard key={w.id} worker={w} query={bookQuery} highlight={f.skills} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="search"
              title="No helpers match these filters"
              text="Try a different time, widen the price range or clear a filter."
              action={
                <button className="btn btn-primary" onClick={clearAll}>
                  Clear all filters
                </button>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
