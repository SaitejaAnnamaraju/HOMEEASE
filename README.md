# HomeEase — Your Home, Taken Care Of.

HomeEase is a household-services booking marketplace that runs entirely in the browser. Customers find verified helpers, compare their prices and availability, and book one helper for several services in a single visit (for example cooking, cleaning and laundry from 5 PM to 7 PM). Helpers manage their requests, earnings, profile and weekly availability.

> Frontend only: there's no backend, database, API or payment gateway. All data is fictional and is stored in the browser's `localStorage`.

## Tech stack

| Technology | Used for |
| --- | --- |
| HTML5 | `index.html`, the AngularJS template `availability.html` |
| CSS3 | Hand-written stylesheets: design tokens, animations, responsive layouts (no Tailwind) |
| JavaScript (ES6+) | All application logic (no TypeScript) |
| React 18 | The main application |
| React Router DOM 6 | Client-side routing |
| AngularJS 1.8 | An isolated module for worker availability and service management |
| LocalStorage | Saving demo data, sessions and bookings |
| Vite 5 | Development server and production build |

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@homeease.demo` | `demo123` |
| Worker | `worker@homeease.demo` | `demo123` |

The **Demo Customer** and **Demo Worker** buttons on the landing and login pages log you in and open the matching dashboard. Use **Reset demo data** in the footer to restore the original data.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

Requires Node.js 18 or newer.

## Features

- **Landing page:** hero search (location, date, time, service), popular services, how it works, featured helpers, testimonials, a section for prospective helpers, and the demo buttons.
- **Authentication (simulated):** separate customer and worker registration. Worker registration includes experience, skills, languages, hourly charge and profile-picture upload; the picture is resized on a canvas so it fits in localStorage.
- **Find Helpers:** filters for service, location, maximum price, experience, rating and availability (a specific date, a weekday, a time of day or an exact hour), plus free-text search and five sort orders. Filters are kept in the URL, so a filtered search can be shared.
- **Worker profile:** personal details, services, languages, weekly schedule, next free slots, a rating breakdown and reviews.
- **Booking flow:** choose several services, a date, a free start time (taken hours are blocked), and a duration. The summary shows the total (rate × hours). Confirming creates a booking ID such as `HE-2611-4821` and saves the booking to localStorage.
- **Customer dashboard:** overview, upcoming and past bookings, cancellation, rating and review, booking again, saved helpers, notifications and profile/password editing.
- **Worker dashboard:** stats (total, pending, completed, estimated earnings), a 6-month earnings chart in SVG, booking requests (accept, reject, mark completed, view customer details), reviews, profile editing, and the AngularJS availability manager.

## How React and AngularJS work together

```
React (owns the whole app)
 └─ <AngularAvailability workerId>   ← React renders only an empty host <div>
     └─ mountAvailabilityModule()    ← creates a child node, injects availability.html,
                                        and calls angular.bootstrap() on that node
```

- **Separate DOM.** React never renders into or reads from the AngularJS node. When the React component unmounts, the AngularJS `$rootScope` is destroyed and its node is removed.
- **Shared data.** Both frameworks read and write the same localStorage key, `he_workers`.
- **Events.** After a save, AngularJS dispatches `homeease:availability-updated` and `homeease:data-changed` on `window`. React listens for these, re-renders (for example search results and the public profile), and shows a toast. When React resets the demo data, it dispatches `homeease:data-reset`, and the AngularJS module reloads.
- **Lazy loading.** AngularJS is loaded only when a helper opens *Availability & services*, so customers never download it.

In the AngularJS module, helpers can switch weekdays on or off, set start and end hours, block individual hourly slots, apply presets (weekday evenings, weekday mornings, copy Monday, clear all), change their hourly charge, and update their services. A live preview shows what customers will see.

## Project structure

```
homeease/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json               # SPA rewrites for Vercel
├── public/images/            # logo, favicon, background pattern
└── src/
    ├── main.jsx              # entry point: seeds demo data and mounts React
    ├── App.jsx               # routes
    ├── angular-module/       # AngularJS 1.x module
    │   ├── availability.html
    │   ├── availability.js
    │   └── availability.css
    ├── components/           # Navbar, Footer, WorkerCard, EarningsChart, modals, the AngularJS bridge…
    ├── context/AppContext.jsx
    ├── data/                 # constants and fictional seed data
    ├── pages/
    │   ├── Landing, Login, Register, FindHelpers, WorkerProfile, Booking, BookingSuccess, NotFound
    │   ├── customer/CustomerDashboard.jsx
    │   └── worker/WorkerDashboard.jsx
    ├── styles/               # base, components, pages, dashboard CSS
    └── utils/                # helpers (dates, slots, formatting) and storage (localStorage "database")
```

### LocalStorage keys

`he_users`, `he_workers`, `he_bookings`, `he_reviews`, `he_notifications`, `he_session`, `he_seed_version`

## Deploying

### 1. Push to GitHub

```bash
cd homeease
git init
git add .
git commit -m "HomeEase: React + AngularJS household services marketplace"
git branch -M main
git remote add origin https://github.com/<your-username>/homeease.git
git push -u origin main
```

Create the empty `homeease` repository on GitHub first, at https://github.com/new, without a README.

### 2. Deploy on Vercel

**Option A: dashboard**

1. Go to https://vercel.com/new and import the GitHub repository.
2. Vercel detects **Vite** automatically. Check these settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
3. Click **Deploy**. You don't need any environment variables.

**Option B: CLI**

```bash
npm i -g vercel
vercel          # first deploy (preview)
vercel --prod   # production deploy
```

`vercel.json` rewrites every path to `index.html`, so routes such as `/helpers` or `/worker/availability` still load when the page is refreshed or a deep link is opened.

## Notes

- Helper photos are loaded from randomuser.me. If an image fails to load, the app shows an initials avatar instead.
- Data lives in each visitor's own browser, so changes are not shared between devices.
- All people, phone numbers and reviews are fictional.
