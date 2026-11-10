import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';
import { Avatar, Logo } from './Common.jsx';

export default function Navbar() {
  const { user, logout, db, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const dash = user?.role === 'worker' ? '/worker' : '/customer';
  const unread = user ? db.getNotifications(user.id).filter((n) => !n.read).length : 0;
  const worker = user?.workerId ? db.getWorker(user.workerId) : null;

  const handleLogout = () => {
    logout();
    toast('You have been logged out.', 'info');
    navigate('/');
  };

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Logo />
        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/helpers">Find Helpers</NavLink>
          <a href="/#services" onClick={(e) => scrollOrGo(e, 'services', location, navigate)}>
            Services
          </a>
          <a href="/#how" onClick={(e) => scrollOrGo(e, 'how', location, navigate)}>
            How it works
          </a>
          {!user && <NavLink to="/register?role=worker">Become a Helper</NavLink>}
          {user && <NavLink to={dash}>Dashboard</NavLink>}
          {!user && (
            <div className="nav-auth-mobile">
              <Link className="btn btn-ghost" to="/login">
                Log in
              </Link>
              <Link className="btn btn-primary" to="/register">
                Sign up
              </Link>
            </div>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to={`${dash}/notifications`} className="icon-btn bell" aria-label={`Notifications (${unread} unread)`}>
                <Icon name="bell" />
                {unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <div className="user-menu" ref={menuRef}>
                <button className="user-trigger" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                  <Avatar src={worker?.photo} name={user.name} size={34} />
                  <span className="hide-sm">{user.name.split(' ')[0]}</span>
                  <Icon name="chevron-down" size={16} />
                </button>
                {menu && (
                  <div className="dropdown">
                    <div className="dropdown-head">
                      <b>{user.name}</b>
                      <small>{user.role === 'worker' ? 'Helper account' : 'Customer account'}</small>
                    </div>
                    <Link to={dash}>
                      <Icon name="grid" size={18} /> Dashboard
                    </Link>
                    {user.role === 'customer' ? (
                      <>
                        <Link to="/customer/bookings">
                          <Icon name="calendar" size={18} /> My bookings
                        </Link>
                        <Link to="/customer/saved">
                          <Icon name="heart" size={18} /> Saved helpers
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/worker/requests">
                          <Icon name="inbox" size={18} /> Booking requests
                        </Link>
                        <Link to="/worker/availability">
                          <Icon name="clock" size={18} /> Availability
                        </Link>
                      </>
                    )}
                    <Link to={`${dash}/profile`}>
                      <Icon name="settings" size={18} /> Profile
                    </Link>
                    <button onClick={handleLogout}>
                      <Icon name="logout" size={18} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link className="btn btn-ghost" to="/login">
                Log in
              </Link>
              <Link className="btn btn-primary" to="/register">
                Sign up
              </Link>
            </div>
          )}
          <button className="icon-btn burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}

function scrollOrGo(e, id, location, navigate) {
  e.preventDefault();
  if (location.pathname === '/') {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  } else {
    navigate('/', { state: { scrollTo: id } });
  }
}
