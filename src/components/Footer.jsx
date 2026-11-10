import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { SERVICES } from '../data/constants.js';
import { Logo, Modal } from './Common.jsx';
import Icon from './Icon.jsx';

export default function Footer() {
  const { db, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();

  const reset = () => {
    db.resetDemoData();
    setConfirm(false);
    toast('Demo data has been reset to its original state.', 'info');
    navigate('/');
  };

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p className="tagline">Your Home, Taken Care Of.</p>
          <p className="muted-light">
            Book verified cooks, cleaners and caregivers by the hour across Hyderabad. A frontend demo — no real
            bookings or payments are made.
          </p>
        </div>
        <div>
          <h5>Services</h5>
          {SERVICES.slice(0, 6).map((s) => (
            <Link key={s.id} to={`/helpers?service=${s.id}`}>
              {s.name}
            </Link>
          ))}
        </div>
        <div>
          <h5>HomeEase</h5>
          <Link to="/helpers">Find Helpers</Link>
          <Link to="/register?role=worker">Become a Helper</Link>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
        </div>
        <div>
          <h5>Demo</h5>
          <p className="muted-light small">
            customer@homeease.demo
            <br />
            worker@homeease.demo
            <br />
            Password: demo123
          </p>
          <button className="btn btn-outline-light btn-sm" onClick={() => setConfirm(true)}>
            <Icon name="refresh" size={16} /> Reset demo data
          </button>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} HomeEase. Built with React.js &amp; AngularJS.</span>
        <span>All people and reviews shown are fictional.</span>
      </div>

      <Modal
        open={confirm}
        title="Reset demo data?"
        onClose={() => setConfirm(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>
              Keep my changes
            </button>
            <button className="btn btn-danger" onClick={reset}>
              Reset data
            </button>
          </>
        }
      >
        <p>
          This restores the original helpers, bookings and accounts, removes any accounts you registered, and logs
          you out.
        </p>
      </Modal>
    </footer>
  );
}
