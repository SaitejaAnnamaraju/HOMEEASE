// LocalStorage "database" for the demo. No backend involved.
import { STORAGE_KEYS as K, EVENTS } from '../data/constants.js';
import { buildSeedData } from '../data/seed.js';
import { makeId, makeBookingId, formatDate, formatHour, bookedHours } from './helpers.js';

const SEED_VERSION = '1.0';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('HomeEase: could not save to localStorage', err);
  }
}

export function emitChange() {
  window.dispatchEvent(new CustomEvent(EVENTS.dataChanged));
}

/* ---------- seeding ---------- */
function seedAll() {
  const data = buildSeedData();
  write(K.users, data.users);
  write(K.workers, data.workers);
  write(K.bookings, data.bookings);
  write(K.reviews, data.reviews);
  write(K.notifications, data.notifications);
  localStorage.setItem(K.seedVersion, SEED_VERSION);
}

export function ensureSeeded() {
  if (localStorage.getItem(K.seedVersion) !== SEED_VERSION || !localStorage.getItem(K.workers)) seedAll();
}

export function resetDemoData() {
  seedAll();
  localStorage.removeItem(K.session);
  window.dispatchEvent(new CustomEvent(EVENTS.dataReset));
  emitChange();
}

/* ---------- session ---------- */
export const getSessionUserId = () => read(K.session, null);
export function setSession(userId) {
  write(K.session, userId);
  emitChange();
}
export function clearSession() {
  localStorage.removeItem(K.session);
  emitChange();
}

/* ---------- users ---------- */
export const getUsers = () => read(K.users, []);
export const getUser = (id) => getUsers().find((u) => u.id === id) || null;
export const findUserByEmail = (email) =>
  getUsers().find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase()) || null;
export const getUserForWorker = (workerId) => getUsers().find((u) => u.workerId === workerId) || null;

export function authenticate(email, password) {
  const user = findUserByEmail(email);
  if (!user) return { error: 'No account found with that email.' };
  if (user.password !== password) return { error: 'Incorrect password. Please try again.' };
  return { user };
}

export function registerUser(data) {
  if (findUserByEmail(data.email)) return { error: 'An account with this email already exists.' };
  const users = getUsers();
  const user = {
    id: makeId('u'),
    role: data.role,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    location: data.location,
    address: data.address || '',
    password: data.password,
    savedWorkers: [],
    createdAt: new Date().toISOString()
  };

  if (data.role === 'worker') {
    const workers = getWorkers();
    const worker = {
      id: makeId('w'),
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: data.location,
      photo: data.photo || '',
      experience: Number(data.experience) || 0,
      hourlyRate: Number(data.hourlyRate) || 150,
      services: data.skills,
      languages: data.languages?.length ? data.languages : ['Telugu', 'Hindi'],
      rating: 0,
      reviewCount: 0,
      jobsDone: 0,
      verified: false,
      bio: data.bio || `Hi, I'm ${user.name.split(' ')[0]}. I'm a dependable household helper with ${Number(data.experience) || 0} years of experience.`,
      availability: {
        Monday: { available: true, start: 9, end: 13, disabled: [] },
        Tuesday: { available: true, start: 9, end: 13, disabled: [] },
        Wednesday: { available: true, start: 9, end: 13, disabled: [] },
        Thursday: { available: true, start: 9, end: 13, disabled: [] },
        Friday: { available: true, start: 9, end: 13, disabled: [] },
        Saturday: { available: false, start: 9, end: 13, disabled: [] },
        Sunday: { available: false, start: 9, end: 13, disabled: [] }
      }
    };
    workers.push(worker);
    write(K.workers, workers);
    user.workerId = worker.id;
  }

  users.push(user);
  write(K.users, users);
  addNotification(
    user.id,
    user.role === 'worker'
      ? 'Welcome to HomeEase! Set your weekly availability so customers can book you.'
      : 'Welcome to HomeEase! Find a trusted helper near you in minutes.',
    'success',
    true
  );
  emitChange();
  return { user };
}

export function updateUser(id, patch) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  if (patch.email && patch.email.toLowerCase() !== users[idx].email) {
    const clash = findUserByEmail(patch.email);
    if (clash && clash.id !== id) return { error: 'That email is already used by another account.' };
  }
  users[idx] = { ...users[idx], ...patch };
  write(K.users, users);
  // Keep the linked worker profile's contact details in sync
  if (users[idx].workerId) {
    const { name, email, phone, location } = users[idx];
    updateWorker(users[idx].workerId, { name, email, phone, location }, true);
  }
  emitChange();
  return { user: users[idx] };
}

export function toggleSavedWorker(userId, workerId) {
  const user = getUser(userId);
  if (!user) return false;
  const saved = user.savedWorkers || [];
  const isSaved = saved.includes(workerId);
  updateUser(userId, { savedWorkers: isSaved ? saved.filter((w) => w !== workerId) : [...saved, workerId] });
  return !isSaved;
}

/* ---------- workers ---------- */
export const getWorkers = () => read(K.workers, []);
export const getWorker = (id) => getWorkers().find((w) => w.id === id) || null;

export function updateWorker(id, patch, silent = false) {
  const workers = getWorkers();
  const idx = workers.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  workers[idx] = { ...workers[idx], ...patch };
  write(K.workers, workers);
  // Keep denormalised names/photos on bookings fresh
  if (patch.name || patch.photo) {
    const bookings = getBookings().map((b) =>
      b.workerId === id ? { ...b, workerName: workers[idx].name, workerPhoto: workers[idx].photo } : b
    );
    write(K.bookings, bookings);
  }
  if (!silent) emitChange();
  return workers[idx];
}

/* ---------- bookings ---------- */
export const getBookings = () => read(K.bookings, []);
export const getBooking = (id) => getBookings().find((b) => b.id === id) || null;
export const getCustomerBookings = (userId) => getBookings().filter((b) => b.customerId === userId);
export const getWorkerBookings = (workerId) => getBookings().filter((b) => b.workerId === workerId);

export function createBooking({ customer, worker, services, date, startTime, duration, notes, address }) {
  const bookings = getBookings();
  const taken = bookedHours(worker.id, date, bookings);
  for (let h = startTime; h < startTime + duration; h += 1) {
    if (taken.has(h)) return { error: 'That slot was just booked by someone else. Please pick another time.' };
  }
  let id = makeBookingId();
  while (bookings.some((b) => b.id === id)) id = makeBookingId();
  const booking = {
    id,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerLocation: customer.location,
    address: address || customer.address || customer.location,
    workerId: worker.id,
    workerName: worker.name,
    workerPhoto: worker.photo,
    services,
    date,
    startTime,
    duration,
    hourlyRate: worker.hourlyRate,
    total: worker.hourlyRate * duration,
    status: 'pending',
    notes: notes || '',
    reviewed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  bookings.unshift(booking);
  write(K.bookings, bookings);

  addNotification(customer.id, `Booking ${id} sent to ${worker.name}. You'll be notified when it's accepted.`, 'info', true);
  const workerUser = getUserForWorker(worker.id);
  if (workerUser) {
    addNotification(
      workerUser.id,
      `New booking request from ${customer.name} for ${formatDate(date, { year: false })}, ${formatHour(startTime)} (${id}).`,
      'info',
      true
    );
  }
  emitChange();
  return { booking };
}

const STATUS_MESSAGES = {
  accepted: (b) => `${b.workerName} accepted your booking ${b.id} on ${formatDate(b.date, { year: false })}.`,
  rejected: (b) => `${b.workerName} couldn't take booking ${b.id}. Try another helper for that slot.`,
  completed: (b) => `Booking ${b.id} with ${b.workerName} is complete. Leave a review!`
};

export function updateBookingStatus(id, status) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const b = { ...bookings[idx], status, updatedAt: new Date().toISOString() };
  bookings[idx] = b;
  write(K.bookings, bookings);

  if (STATUS_MESSAGES[status]) {
    addNotification(b.customerId, STATUS_MESSAGES[status](b), status === 'rejected' ? 'warning' : 'success', true);
  }
  if (status === 'completed') {
    const w = getWorker(b.workerId);
    if (w) updateWorker(w.id, { jobsDone: (w.jobsDone || 0) + 1 }, true);
  }
  if (status === 'cancelled') {
    const workerUser = getUserForWorker(b.workerId);
    if (workerUser) addNotification(workerUser.id, `${b.customerName} cancelled booking ${b.id}.`, 'warning', true);
    addNotification(b.customerId, `You cancelled booking ${b.id}.`, 'info', true);
  }
  emitChange();
  return b;
}

/* ---------- reviews ---------- */
export const getReviews = (workerId) =>
  read(K.reviews, [])
    .filter((r) => !workerId || r.workerId === workerId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

export function addReview({ bookingId, rating, comment, customer }) {
  const booking = getBooking(bookingId);
  if (!booking) return null;
  const reviews = read(K.reviews, []);
  const review = {
    id: makeId('r'),
    workerId: booking.workerId,
    customerId: customer.id,
    customerName: customer.name.split(' ')[0] + ' ' + (customer.name.split(' ')[1]?.[0] || '') + '.',
    rating,
    comment: comment.trim(),
    date: new Date().toISOString().slice(0, 10)
  };
  reviews.unshift(review);
  write(K.reviews, reviews);

  const bookings = getBookings().map((b) => (b.id === bookingId ? { ...b, reviewed: true } : b));
  write(K.bookings, bookings);

  const w = getWorker(booking.workerId);
  if (w) {
    const count = (w.reviewCount || 0) + 1;
    const avg = ((w.rating || 0) * (w.reviewCount || 0) + rating) / count;
    updateWorker(w.id, { rating: Math.round(avg * 100) / 100, reviewCount: count }, true);
    const workerUser = getUserForWorker(w.id);
    if (workerUser) addNotification(workerUser.id, `${customer.name} rated you ${rating}★ for booking ${bookingId}.`, 'success', true);
  }
  emitChange();
  return review;
}

/* ---------- notifications ---------- */
export const getNotifications = (userId) =>
  read(K.notifications, [])
    .filter((n) => n.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export function addNotification(userId, message, type = 'info', silent = false) {
  const all = read(K.notifications, []);
  all.unshift({ id: makeId('n'), userId, message, type, read: false, createdAt: new Date().toISOString() });
  write(K.notifications, all.slice(0, 200));
  if (!silent) emitChange();
}

export function markNotificationsRead(userId, id) {
  const all = read(K.notifications, []).map((n) =>
    n.userId === userId && (!id || n.id === id) ? { ...n, read: true } : n
  );
  write(K.notifications, all);
  emitChange();
}

export function clearNotifications(userId) {
  write(
    K.notifications,
    read(K.notifications, []).filter((n) => n.userId !== userId)
  );
  emitChange();
}
