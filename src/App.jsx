import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Toasts from './components/Toasts.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import FindHelpers from './pages/FindHelpers.jsx';
import WorkerProfile from './pages/WorkerProfile.jsx';
import Booking from './pages/Booking.jsx';
import BookingSuccess from './pages/BookingSuccess.jsx';
import NotFound from './pages/NotFound.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import WorkerDashboard from './pages/worker/WorkerDashboard.jsx';

function ScrollManager() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    if (state?.scrollTo) {
      setTimeout(() => document.getElementById(state.scrollTo)?.scrollIntoView({ behavior: 'smooth' }), 60);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, state]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/helpers" element={<FindHelpers />} />
          <Route path="/workers/:id" element={<WorkerProfile />} />
          <Route
            path="/book/:id"
            element={
              <ProtectedRoute role="customer">
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/success/:bookingId"
            element={
              <ProtectedRoute role="customer">
                <BookingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/:tab?"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/:tab?"
            element={
              <ProtectedRoute role="worker">
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toasts />
    </>
  );
}
