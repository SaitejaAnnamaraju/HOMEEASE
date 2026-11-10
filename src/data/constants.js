// Shared, framework-agnostic catalog data.
// Used by both the React app and the AngularJS availability module.

export const CITY = 'Hyderabad';

export const SERVICES = [
  { id: 'cooking', name: 'Cooking', icon: 'chef', desc: 'Fresh home-style meals, tiffins and meal prep.', from: 140 },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles', desc: 'Sweeping, mopping, dusting and deep cleans.', from: 120 },
  { id: 'laundry', name: 'Laundry', icon: 'shirt', desc: 'Washing, drying and folding clothes.', from: 110 },
  { id: 'dishwashing', name: 'Dishwashing', icon: 'droplet', desc: 'Utensils washed, dried and put away.', from: 100 },
  { id: 'babysitting', name: 'Babysitting', icon: 'baby', desc: 'Caring, attentive help with little ones.', from: 180 },
  { id: 'elderly-care', name: 'Elderly Care', icon: 'heart', desc: 'Companionship and daily assistance.', from: 190 },
  { id: 'ironing', name: 'Ironing', icon: 'iron', desc: 'Crisp, neatly pressed clothes.', from: 100 },
  { id: 'gardening', name: 'Gardening', icon: 'leaf', desc: 'Plant care, watering and balcony gardens.', from: 130 },
  { id: 'pet-care', name: 'Pet Care', icon: 'paw', desc: 'Walks, feeding and pet sitting.', from: 150 },
  { id: 'grocery', name: 'Grocery Runs', icon: 'bag', desc: 'Groceries and errands, done for you.', from: 110 }
];

export const SERVICE_MAP = SERVICES.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});

export const LOCATIONS = [
  'Gachibowli',
  'Madhapur',
  'Kondapur',
  'Hitech City',
  'Banjara Hills',
  'Jubilee Hills',
  'Kukatpally',
  'Miyapur',
  'Begumpet',
  'Secunderabad'
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Urdu', 'Tamil', 'Kannada', 'Marathi', 'Bengali'];

// Hours offered in pickers (6 AM – 10 PM)
export const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

export const STORAGE_KEYS = {
  users: 'he_users',
  workers: 'he_workers',
  bookings: 'he_bookings',
  reviews: 'he_reviews',
  notifications: 'he_notifications',
  session: 'he_session',
  seedVersion: 'he_seed_version'
};

// Custom DOM events used for React <-> AngularJS communication
export const EVENTS = {
  dataChanged: 'homeease:data-changed',
  availabilityUpdated: 'homeease:availability-updated',
  dataReset: 'homeease:data-reset'
};

export const DEMO = {
  customer: { email: 'customer@homeease.demo', password: 'demo123' },
  worker: { email: 'worker@homeease.demo', password: 'demo123' }
};
