import { useState } from 'react';
import { formatINR } from '../utils/helpers.js';

/** Monthly earnings bar chart (pure SVG, no chart library). */
export default function EarningsChart({ bookings }) {
  const [active, setActive] = useState(null);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en-IN', { month: 'short' }), total: 0, jobs: 0 };
  });
  bookings
    .filter((b) => b.status === 'completed')
    .forEach((b) => {
      const m = months.find((x) => b.date.startsWith(x.key));
      if (m) {
        m.total += b.total;
        m.jobs += 1;
      }
    });

  const max = Math.max(...months.map((m) => m.total), 500);
  const nice = Math.ceil(max / 500) * 500;
  const W = 560;
  const H = 220;
  const pad = { l: 48, r: 8, t: 16, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const bw = (iw / months.length) * 0.5;
  const ticks = [0, 0.5, 1].map((f) => Math.round(nice * f));
  const sum = months.reduce((s, m) => s + m.total, 0);

  return (
    <div className="chart">
      <div className="chart-head">
        <div>
          <h4>Earnings, last 6 months</h4>
          <p className="muted">Completed jobs only</p>
        </div>
        <div className="chart-total">{formatINR(sum)}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly earnings bar chart">
        {ticks.map((t) => {
          const y = pad.t + ih - (t / nice) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className="grid" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" className="axis">
                {t >= 1000 ? `₹${t / 1000}k` : `₹${t}`}
              </text>
            </g>
          );
        })}
        {months.map((m, i) => {
          const h = (m.total / nice) * ih;
          const x = pad.l + (iw / months.length) * i + (iw / months.length - bw) / 2;
          const y = pad.t + ih - h;
          const isLast = i === months.length - 1;
          return (
            <g
              key={m.key}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              tabIndex={0}
            >
              <rect x={x - 6} y={pad.t} width={bw + 12} height={ih} fill="transparent" />
              <rect x={x} y={y} width={bw} height={Math.max(h, 2)} rx="6" className={`bar ${isLast ? 'current' : ''} ${active === i ? 'hover' : ''}`} />
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="axis">
                {m.label}
              </text>
              {active === i && (
                <g>
                  <rect x={Math.min(x + bw / 2 - 52, W - 108)} y={Math.max(y - 46, 0)} width="104" height="38" rx="8" className="tip-bg" />
                  <text x={Math.min(x + bw / 2, W - 56)} y={Math.max(y - 46, 0) + 16} textAnchor="middle" className="tip-val">
                    {formatINR(m.total)}
                  </text>
                  <text x={Math.min(x + bw / 2, W - 56)} y={Math.max(y - 46, 0) + 30} textAnchor="middle" className="tip-sub">
                    {m.jobs} job{m.jobs === 1 ? '' : 's'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
