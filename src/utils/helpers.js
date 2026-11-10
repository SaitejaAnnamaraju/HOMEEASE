import { DAYS, SERVICE_MAP } from '../data/constants.js';

/* ---------- money ---------- */
export const formatINR = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

/* ---------- time ---------- */
export function formatHour(h) {
  const hour = Number(h);
  if (Number.isNaN(hour)) return '';
  const suffix = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  const base = hour % 12 === 0 ? 12 : hour % 12;
  return `${base} ${suffix}`;
}

export const formatRange = (start, end) => `${formatHour(start)} – ${formatHour(end)}`;

/* ---------- dates (always local, yyyy-mm-dd) ---------- */
export function toISODate(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const todayISO = () => toISODate(new Date());

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function weekdayOf(iso) {
  const js = parseISO(iso).getDay(); // 0 = Sunday
  return DAYS[(js + 6) % 7];
}

export function formatDate(iso, opts = {}) {
  if (!iso) return '';
  return parseISO(iso).toLocaleDateString('en-IN', {
    weekday: opts.weekday === false ? undefined : 'short',
    day: 'numeric',
    month: 'short',
    year: opts.year === false ? undefined : 'numeric'
  });
}

export function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ---------- availability ---------- */
export function getDaySlots(worker, dayName) {
  const day = worker?.availability?.[dayName];
  if (!day || !day.available) return [];
  const disabled = day.disabled || [];
  const slots = [];
  for (let h = Number(day.start); h < Number(day.end); h += 1) {
    if (!disabled.includes(h)) slots.push(h);
  }
  return slots;
}

export function bookedHours(workerId, iso, bookings, ignoreId) {
  const hours = new Set();
  bookings
    .filter(
      (b) =>
        b.workerId === workerId &&
        b.date === iso &&
        b.id !== ignoreId &&
        (b.status === 'pending' || b.status === 'accepted')
    )
    .forEach((b) => {
      for (let h = b.startTime; h < b.startTime + b.duration; h += 1) hours.add(h);
    });
  return hours;
}

/** Hours on the given date that are offered by the worker and not already booked. */
export function getFreeSlots(worker, iso, bookings) {
  if (!worker || !iso) return [];
  const taken = bookedHours(worker.id, iso, bookings);
  let slots = getDaySlots(worker, weekdayOf(iso)).filter((h) => !taken.has(h));
  if (iso === todayISO()) {
    const now = new Date().getHours();
    slots = slots.filter((h) => h > now);
  }
  return slots;
}

/** Can a booking of `duration` hours start at `start`, given the free hours? */
export function fitsDuration(freeSlots, start, duration) {
  for (let h = start; h < start + duration; h += 1) {
    if (!freeSlots.includes(h)) return false;
  }
  return true;
}

export function longestRunFrom(freeSlots, start) {
  let n = 0;
  while (freeSlots.includes(start + n)) n += 1;
  return n;
}

export function availabilitySummary(worker) {
  return DAYS.map((day) => {
    const d = worker?.availability?.[day];
    const slots = getDaySlots(worker, day);
    if (!d || !d.available || slots.length === 0) return { day, available: false, label: 'Unavailable', slots: [] };
    const partial = slots.length < d.end - d.start;
    return {
      day,
      available: true,
      label: formatRange(d.start, d.end) + (partial ? ` (${slots.length} slot${slots.length === 1 ? '' : 's'} open)` : ''),
      slots
    };
  });
}

export function weeklyHours(worker) {
  return DAYS.reduce((sum, day) => sum + getDaySlots(worker, day).length, 0);
}

export function availableDays(worker) {
  return DAYS.filter((day) => getDaySlots(worker, day).length > 0);
}

/** Next `count` dates (from today) when the worker works. */
export function upcomingWorkingDates(worker, count = 3, from = new Date()) {
  const out = [];
  for (let i = 0; i < 30 && out.length < count; i += 1) {
    const iso = toISODate(addDays(from, i));
    if (getDaySlots(worker, weekdayOf(iso)).length) out.push(iso);
  }
  return out;
}

/* ---------- misc ---------- */
export const serviceName = (id) => SERVICE_MAP[id]?.name || id;
export const serviceNames = (ids = []) => ids.map(serviceName).join(', ');

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function avatarFallback(name = 'H E') {
  const palette = ['#0b6b52', '#f28c28', '#127e8a', '#7a5af8', '#c2410c'];
  const color = palette[name.length % palette.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='${color}'/><text x='50' y='50' dy='.35em' text-anchor='middle' font-family='Arial' font-weight='700' font-size='38' fill='#fff'>${initials(name)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function makeId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function makeBookingId() {
  const d = new Date();
  const yymm = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `HE-${yymm}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Downscale an uploaded image to keep localStorage small. */
export function resizeImage(file, size = 240) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).trim());
export const isValidPhone = (p) => /^[6-9]\d{9}$/.test(String(p).replace(/\D/g, '').slice(-10)) && String(p).replace(/\D/g, '').length >= 10;
