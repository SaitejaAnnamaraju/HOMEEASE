// Fictional demo data. All names, phone numbers and reviews are made up.
import { DAYS, DEMO } from './constants.js';
import { addDays, toISODate, weekdayOf, getDaySlots } from '../utils/helpers.js';

const photo = (g, n) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

const off = { available: false, start: 9, end: 17, disabled: [] };
const on = (start, end, disabled = []) => ({ available: true, start, end, disabled });

function week(map) {
  return DAYS.reduce((acc, d) => {
    acc[d] = map[d] ? { ...map[d] } : { ...off };
    return acc;
  }, {});
}

const WORKERS = [
  {
    id: 'w1',
    name: 'Lakshmi Devi',
    email: DEMO.worker.email,
    phone: '9848012345',
    location: 'Gachibowli',
    photo: photo('women', 44),
    gender: 'Female',
    experience: 8,
    hourlyRate: 150,
    services: ['cooking', 'cleaning', 'laundry', 'dishwashing'],
    languages: ['Telugu', 'Hindi', 'English'],
    rating: 4.9,
    reviewCount: 128,
    jobsDone: 412,
    verified: true,
    bio: 'I have been cooking and managing homes for working families for eight years. I specialise in Andhra and North Indian home food, and I leave every kitchen cleaner than I found it.',
    availability: week({
      Monday: on(17, 19),
      Tuesday: on(18, 21),
      Thursday: on(17, 20),
      Friday: on(9, 13),
      Saturday: on(10, 14)
    })
  },
  {
    id: 'w2',
    name: 'Ravi Kumar',
    email: 'ravi.kumar@homeease.demo',
    phone: '9701122334',
    location: 'Madhapur',
    photo: photo('men', 32),
    gender: 'Male',
    experience: 6,
    hourlyRate: 130,
    services: ['cleaning', 'dishwashing', 'gardening', 'grocery'],
    languages: ['Telugu', 'Hindi'],
    rating: 4.7,
    reviewCount: 86,
    jobsDone: 260,
    verified: true,
    bio: 'Deep-cleaning specialist. Bathrooms, kitchens, balconies — I bring my own eco-friendly supplies on request.',
    availability: week({
      Monday: on(7, 11),
      Tuesday: on(7, 11),
      Wednesday: on(7, 11),
      Thursday: on(7, 11),
      Friday: on(7, 11),
      Saturday: on(8, 16)
    })
  },
  {
    id: 'w3',
    name: 'Sunita Rao',
    email: 'sunita.rao@homeease.demo',
    phone: '9666543210',
    location: 'Kondapur',
    photo: photo('women', 68),
    gender: 'Female',
    experience: 12,
    hourlyRate: 220,
    services: ['babysitting', 'elderly-care', 'cooking'],
    languages: ['Telugu', 'English', 'Kannada'],
    rating: 4.95,
    reviewCount: 203,
    jobsDone: 640,
    verified: true,
    bio: 'Former nursing assistant with 12 years of child and elder care. First-aid certified, calm, and great with toddlers.',
    availability: week({
      Monday: on(9, 18),
      Wednesday: on(9, 18),
      Thursday: on(14, 20),
      Friday: on(9, 18),
      Sunday: on(10, 16)
    })
  },
  {
    id: 'w4',
    name: 'Mohammed Imran',
    email: 'imran@homeease.demo',
    phone: '9959011223',
    location: 'Banjara Hills',
    photo: photo('men', 75),
    gender: 'Male',
    experience: 9,
    hourlyRate: 200,
    services: ['cooking', 'grocery', 'dishwashing'],
    languages: ['Urdu', 'Hindi', 'Telugu', 'English'],
    rating: 4.8,
    reviewCount: 147,
    jobsDone: 380,
    verified: true,
    bio: 'Hyderabadi home chef. Biryani, haleem, tiffins and healthy weekday meal prep for families of all sizes.',
    availability: week({
      Tuesday: on(16, 21),
      Wednesday: on(16, 21),
      Thursday: on(16, 21),
      Friday: on(16, 21),
      Saturday: on(11, 21),
      Sunday: on(11, 21)
    })
  },
  {
    id: 'w5',
    name: 'Kavitha Reddy',
    email: 'kavitha@homeease.demo',
    phone: '9885566778',
    location: 'Jubilee Hills',
    photo: photo('women', 65),
    gender: 'Female',
    experience: 5,
    hourlyRate: 140,
    services: ['laundry', 'ironing', 'cleaning'],
    languages: ['Telugu', 'English'],
    rating: 4.6,
    reviewCount: 64,
    jobsDone: 190,
    verified: true,
    bio: 'Organised and quick. I handle laundry, ironing and wardrobe organisation so your weekends stay free.',
    availability: week({
      Monday: on(10, 15),
      Tuesday: on(10, 15),
      Wednesday: on(10, 15),
      Saturday: on(9, 13),
      Sunday: on(9, 13)
    })
  },
  {
    id: 'w6',
    name: 'Anil Prasad',
    email: 'anil@homeease.demo',
    phone: '9440098765',
    location: 'Kukatpally',
    photo: photo('men', 41),
    gender: 'Male',
    experience: 3,
    hourlyRate: 110,
    services: ['cleaning', 'gardening', 'pet-care'],
    languages: ['Telugu', 'Hindi'],
    rating: 4.4,
    reviewCount: 31,
    jobsDone: 88,
    verified: false,
    bio: 'Energetic helper who loves plants and pets. Balcony gardens, dog walks and weekly home cleaning.',
    availability: week({
      Monday: on(6, 10),
      Tuesday: on(17, 20),
      Wednesday: on(6, 10),
      Thursday: on(17, 20),
      Friday: on(6, 10),
      Saturday: on(7, 12)
    })
  },
  {
    id: 'w7',
    name: 'Fatima Begum',
    email: 'fatima@homeease.demo',
    phone: '9030044556',
    location: 'Hitech City',
    photo: photo('women', 79),
    gender: 'Female',
    experience: 10,
    hourlyRate: 170,
    services: ['cooking', 'babysitting', 'cleaning'],
    languages: ['Urdu', 'Hindi', 'English'],
    rating: 4.85,
    reviewCount: 119,
    jobsDone: 355,
    verified: true,
    bio: 'Mother of two and a careful, loving babysitter. I cook nutritious meals for kids and keep the house tidy while they nap.',
    availability: week({
      Monday: on(13, 19),
      Tuesday: on(13, 19),
      Wednesday: on(13, 19),
      Thursday: on(13, 19),
      Friday: on(13, 19)
    })
  },
  {
    id: 'w8',
    name: 'Srinivas Goud',
    email: 'srinivas@homeease.demo',
    phone: '9177788990',
    location: 'Miyapur',
    photo: photo('men', 52),
    gender: 'Male',
    experience: 15,
    hourlyRate: 240,
    services: ['elderly-care', 'grocery', 'cooking'],
    languages: ['Telugu', 'Hindi', 'Tamil'],
    rating: 4.9,
    reviewCount: 176,
    jobsDone: 720,
    verified: true,
    bio: 'Patient and respectful elder companion. Medication reminders, evening walks, doctor visits and simple South Indian meals.',
    availability: week({
      Monday: on(8, 14),
      Tuesday: on(8, 14),
      Wednesday: on(8, 14),
      Thursday: on(8, 14),
      Friday: on(8, 14),
      Saturday: on(8, 12)
    })
  },
  {
    id: 'w9',
    name: 'Priya Nair',
    email: 'priya@homeease.demo',
    phone: '9848876543',
    location: 'Begumpet',
    photo: photo('women', 12),
    gender: 'Female',
    experience: 4,
    hourlyRate: 160,
    services: ['babysitting', 'pet-care', 'laundry'],
    languages: ['English', 'Hindi', 'Tamil'],
    rating: 4.7,
    reviewCount: 52,
    jobsDone: 140,
    verified: true,
    bio: 'Early-childhood education diploma. Story time, homework help and evening babysitting so parents can step out.',
    availability: week({
      Wednesday: on(17, 22),
      Thursday: on(17, 22),
      Friday: on(17, 22),
      Saturday: on(14, 22),
      Sunday: on(14, 22)
    })
  },
  {
    id: 'w10',
    name: 'Venkatesh Babu',
    email: 'venkatesh@homeease.demo',
    phone: '9000111222',
    location: 'Secunderabad',
    photo: photo('men', 85),
    gender: 'Male',
    experience: 7,
    hourlyRate: 120,
    services: ['cleaning', 'dishwashing', 'ironing', 'laundry'],
    languages: ['Telugu', 'English'],
    rating: 4.5,
    reviewCount: 73,
    jobsDone: 230,
    verified: true,
    bio: 'Reliable all-rounder for daily chores. Punctual, careful with your belongings and happy to follow your routine.',
    availability: week({
      Monday: on(6, 12),
      Tuesday: on(6, 12),
      Wednesday: on(6, 12),
      Thursday: on(6, 12),
      Friday: on(6, 12),
      Saturday: on(6, 12),
      Sunday: on(6, 10)
    })
  },
  {
    id: 'w11',
    name: 'Meena Kumari',
    email: 'meena@homeease.demo',
    phone: '9393012121',
    location: 'Gachibowli',
    photo: photo('women', 90),
    gender: 'Female',
    experience: 11,
    hourlyRate: 180,
    services: ['cooking', 'cleaning', 'elderly-care'],
    languages: ['Telugu', 'Hindi'],
    rating: 4.8,
    reviewCount: 98,
    jobsDone: 410,
    verified: true,
    bio: 'Experienced household manager. Low-oil cooking for diabetic diets and gentle support for senior family members.',
    availability: week({
      Monday: on(16, 20),
      Tuesday: on(16, 20),
      Wednesday: on(16, 20),
      Friday: on(16, 20),
      Sunday: on(9, 13)
    })
  },
  {
    id: 'w12',
    name: 'Arjun Singh',
    email: 'arjun@homeease.demo',
    phone: '9701987654',
    location: 'Kondapur',
    photo: photo('men', 22),
    gender: 'Male',
    experience: 2,
    hourlyRate: 100,
    services: ['grocery', 'pet-care', 'gardening', 'dishwashing'],
    languages: ['Hindi', 'English'],
    rating: 4.3,
    reviewCount: 18,
    jobsDone: 45,
    verified: false,
    bio: 'Student by day, helper by evening. Quick grocery runs, pet walks and plant care at budget-friendly rates.',
    availability: week({
      Monday: on(18, 21),
      Wednesday: on(18, 21),
      Friday: on(18, 21),
      Saturday: on(9, 18),
      Sunday: on(9, 18)
    })
  }
];

const REVIEW_TEXT = [
  'Very punctual and the food tastes just like home. Our evenings are so much calmer now.',
  'Kitchen was spotless after the session. Highly recommend for working couples.',
  'Polite, quick and careful with our things. We have booked again for next week.',
  'Great with our toddler — she did not want her to leave!',
  'Communicated well and finished everything on the list within the time.',
  'Good work overall, arrived 10 minutes late once but made up for it.',
  'My parents feel comfortable and safe. Thank you for the patience and care.',
  'Excellent value for money. The laundry was folded better than a shop does it.'
];
const REVIEWERS = ['Ananya S.', 'Rahul M.', 'Deepika K.', 'Vikram J.', 'Sneha P.', 'Karthik R.', 'Neha G.', 'Arvind T.'];

function buildReviews(today) {
  const reviews = [];
  WORKERS.forEach((w, wi) => {
    const n = 3 + (wi % 2);
    for (let i = 0; i < n; i += 1) {
      const idx = (wi + i * 3) % REVIEW_TEXT.length;
      reviews.push({
        id: `r-${w.id}-${i}`,
        workerId: w.id,
        customerId: null,
        customerName: REVIEWERS[(wi + i) % REVIEWERS.length],
        rating: idx === 5 ? 4 : w.rating >= 4.7 ? 5 : 4,
        comment: REVIEW_TEXT[idx],
        date: toISODate(addDays(today, -(6 + i * 11 + wi)))
      });
    }
  });
  return reviews;
}

/** Find the nearest date (searching from `offset` days, in `direction`) on which the worker works. */
function workingDate(worker, today, offset, direction = 1) {
  for (let i = 0; i < 21; i += 1) {
    const iso = toISODate(addDays(today, offset + i * direction));
    const slots = getDaySlots(worker, weekdayOf(iso));
    if (slots.length) return { iso, slots };
  }
  return { iso: toISODate(addDays(today, offset)), slots: [9] };
}

export function buildSeedData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const workers = WORKERS.map((w) => JSON.parse(JSON.stringify(w)));
  const byId = Object.fromEntries(workers.map((w) => [w.id, w]));

  const users = [
    {
      id: 'u1',
      role: 'customer',
      name: 'Ananya Sharma',
      email: DEMO.customer.email,
      phone: '9876543210',
      location: 'Gachibowli',
      address: 'Flat 402, Lake View Residency, Gachibowli',
      password: DEMO.customer.password,
      savedWorkers: ['w3', 'w4', 'w1'],
      createdAt: addDays(today, -120).toISOString()
    },
    {
      id: 'u2',
      role: 'worker',
      workerId: 'w1',
      name: 'Lakshmi Devi',
      email: DEMO.worker.email,
      phone: '9848012345',
      location: 'Gachibowli',
      password: DEMO.worker.password,
      savedWorkers: [],
      createdAt: addDays(today, -400).toISOString()
    }
  ];

  const ananya = { customerId: 'u1', customerName: 'Ananya Sharma', customerPhone: '9876543210', customerLocation: 'Gachibowli', address: users[0].address };
  const others = [
    { customerId: 'c-ext-1', customerName: 'Rohit Verma', customerPhone: '9811122233', customerLocation: 'Gachibowli', address: 'Villa 12, Aparna Hill Park, Gachibowli' },
    { customerId: 'c-ext-2', customerName: 'Pooja Iyer', customerPhone: '9822233344', customerLocation: 'Madhapur', address: '3rd floor, Cyber Heights, Madhapur' },
    { customerId: 'c-ext-3', customerName: 'Sameer Khan', customerPhone: '9833344455', customerLocation: 'Kondapur', address: 'H.No 2-45, Botanical Garden Rd, Kondapur' },
    { customerId: 'c-ext-4', customerName: 'Divya Menon', customerPhone: '9844455566', customerLocation: 'Hitech City', address: 'Tower B-1104, My Home Avatar, Hitech City' }
  ];

  let seq = 4100;
  const used = {}; // `${workerId}|${date}` -> Set of booked hours (avoid overlapping demo bookings)
  const mk = (cust, workerId, services, offset, dir, status, duration, extra = {}) => {
    const w = byId[workerId];
    const { iso, slots: daySlots } = workingDate(w, today, offset, dir);
    const key = `${workerId}|${iso}`;
    used[key] = used[key] || new Set();
    const free = daySlots.filter((h) => !used[key].has(h));
    const slots = free.length ? free : daySlots;
    const start = slots[0];
    let dur = 0;
    while (dur < duration && slots.includes(start + dur)) dur += 1;
    dur = Math.max(dur, 1);
    if (status === 'pending' || status === 'accepted' || status === 'completed') {
      for (let h = start; h < start + dur; h += 1) used[key].add(h);
    }
    seq += 37;
    const d = new Date(iso);
    return {
      id: `HE-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${seq}`,
      ...cust,
      workerId,
      workerName: w.name,
      workerPhoto: w.photo,
      services,
      date: iso,
      startTime: start,
      duration: dur,
      hourlyRate: w.hourlyRate,
      total: w.hourlyRate * dur,
      status,
      notes: extra.notes || '',
      reviewed: !!extra.reviewed,
      createdAt: addDays(parseDate(iso), dir > 0 ? -2 : -4).toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const bookings = [
    // Demo customer (Ananya)
    mk(ananya, 'w1', ['cooking', 'cleaning', 'laundry'], 1, 1, 'accepted', 2, { notes: 'Dinner for 4. Less spicy please.' }),
    mk(ananya, 'w3', ['babysitting'], 3, 1, 'pending', 3, { notes: 'Our daughter is 3 years old.' }),
    mk(ananya, 'w4', ['cooking'], 8, 1, 'pending', 2),
    mk(ananya, 'w2', ['cleaning', 'dishwashing'], -6, -1, 'completed', 3),
    mk(ananya, 'w5', ['laundry', 'ironing'], -18, -1, 'completed', 2, { reviewed: true }),
    mk(ananya, 'w1', ['cooking'], -26, -1, 'cancelled', 2),
    // Requests for the demo worker (Lakshmi)
    mk(others[0], 'w1', ['cooking', 'dishwashing'], 2, 1, 'pending', 2, { notes: 'Need chapati and dal for 3 people.' }),
    mk(others[1], 'w1', ['cleaning', 'laundry'], 4, 1, 'pending', 3),
    mk(others[2], 'w1', ['cooking'], 6, 1, 'accepted', 2),
    mk(others[3], 'w1', ['cleaning'], 9, 1, 'rejected', 2),
    // Completed history for the earnings chart
    mk(others[0], 'w1', ['cooking', 'cleaning'], -3, -1, 'completed', 2),
    mk(ananya, 'w1', ['cooking', 'laundry'], -12, -1, 'completed', 2, { reviewed: true }),
    mk(others[1], 'w1', ['cleaning', 'laundry'], -34, -1, 'completed', 3),
    mk(others[2], 'w1', ['cooking'], -41, -1, 'completed', 2),
    mk(others[3], 'w1', ['cooking', 'dishwashing'], -63, -1, 'completed', 3),
    mk(others[0], 'w1', ['cleaning'], -70, -1, 'completed', 2),
    mk(others[1], 'w1', ['cooking', 'cleaning', 'laundry'], -96, -1, 'completed', 3),
    mk(others[2], 'w1', ['laundry'], -125, -1, 'completed', 2),
    mk(others[3], 'w1', ['cooking'], -131, -1, 'completed', 2),
    mk(others[0], 'w1', ['cooking', 'cleaning'], -158, -1, 'completed', 3)
  ];

  const now = Date.now();
  const notifications = [
    { id: 'n1', userId: 'u1', type: 'success', message: `Lakshmi Devi accepted your booking ${bookings[0].id}.`, read: false, createdAt: new Date(now - 3600e3 * 2).toISOString() },
    { id: 'n2', userId: 'u1', type: 'info', message: `Your request ${bookings[1].id} was sent to Sunita Rao.`, read: false, createdAt: new Date(now - 3600e3 * 20).toISOString() },
    { id: 'n3', userId: 'u1', type: 'info', message: 'How was your clean with Ravi Kumar? Leave a review to help others.', read: true, createdAt: new Date(now - 3600e3 * 72).toISOString() },
    { id: 'n4', userId: 'u2', type: 'info', message: `New booking request from Rohit Verma (${bookings[6].id}).`, read: false, createdAt: new Date(now - 3600e3 * 1).toISOString() },
    { id: 'n5', userId: 'u2', type: 'info', message: `New booking request from Pooja Iyer (${bookings[7].id}).`, read: false, createdAt: new Date(now - 3600e3 * 9).toISOString() },
    { id: 'n6', userId: 'u2', type: 'success', message: 'Ananya Sharma rated you 5★ — "Kitchen was spotless."', read: true, createdAt: new Date(now - 3600e3 * 50).toISOString() }
  ];

  return { users, workers, bookings, reviews: buildReviews(today), notifications };
}

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
