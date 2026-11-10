import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { LOCATIONS, SERVICES, LANGUAGES } from '../data/constants.js';
import { isValidEmail, isValidPhone, resizeImage } from '../utils/helpers.js';
import Icon from '../components/Icon.jsx';
import AuthAside from '../components/AuthAside.jsx';
import { Avatar } from '../components/Common.jsx';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  location: '',
  password: '',
  confirm: '',
  experience: '',
  hourlyRate: '150',
  skills: [],
  languages: ['Telugu', 'Hindi'],
  photo: ''
};

export default function Register() {
  const { user, db, toast } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(params.get('role') === 'worker' ? 'worker' : 'customer');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const redirect = params.get('redirect');

  if (user) return <Navigate to={user.role === 'worker' ? '/worker' : '/customer'} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (k, v) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  const onPhoto = async (e) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await resizeImage(file);
      setForm((f) => ({ ...f, photo: data }));
    } catch (err) {
      setPhotoError(err.message);
    }
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 3) er.name = 'Enter your full name.';
    if (!isValidEmail(form.email)) er.email = 'Enter a valid email address.';
    else if (db.findUserByEmail(form.email)) er.email = 'An account with this email already exists.';
    if (!isValidPhone(form.phone)) er.phone = 'Enter a 10-digit Indian mobile number.';
    if (!form.location) er.location = 'Choose your area.';
    if (form.password.length < 6) er.password = 'Use at least 6 characters.';
    if (form.confirm !== form.password) er.confirm = 'Passwords do not match.';
    if (role === 'worker') {
      const exp = Number(form.experience);
      if (form.experience === '' || Number.isNaN(exp) || exp < 0 || exp > 50) er.experience = 'Enter years of experience (0–50).';
      if (!form.skills.length) er.skills = 'Select at least one skill.';
      const rate = Number(form.hourlyRate);
      if (!rate || rate < 80 || rate > 1000) er.hourlyRate = 'Hourly charge must be ₹80–₹1000.';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    const res = db.registerUser({ ...form, role, phone: form.phone.replace(/\D/g, '').slice(-10) });
    if (res.error) {
      setErrors({ email: res.error });
      return;
    }
    db.setSession(res.user.id);
    toast(`Account created. Welcome to HomeEase, ${res.user.name.split(' ')[0]}!`, 'success');
    navigate(role === 'worker' ? '/worker/availability' : redirect || '/customer', { replace: true });
  };

  const Err = ({ k }) => (errors[k] ? <small className="field-error">{errors[k]}</small> : null);

  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-main">
        <form className="auth-card wide" onSubmit={submit} noValidate>
          <h1>Create your account</h1>
          <p className="muted">{role === 'worker' ? 'Join as a helper and start receiving bookings.' : 'Book trusted household help in minutes.'}</p>

          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={role === 'customer'} className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
              <Icon name="user" size={16} /> I need help
            </button>
            <button type="button" role="tab" aria-selected={role === 'worker'} className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}>
              <Icon name="briefcase" size={16} /> I'm a helper
            </button>
          </div>

          {role === 'worker' && (
            <div className="photo-upload">
              <Avatar src={form.photo} name={form.name || 'New Helper'} size={76} />
              <div>
                <label className="btn btn-ghost btn-sm file-btn">
                  <Icon name="upload" size={16} /> {form.photo ? 'Change photo' : 'Upload profile picture'}
                  <input type="file" accept="image/*" onChange={onPhoto} />
                </label>
                <small className="muted block">JPG or PNG. A clear, friendly photo gets more bookings.</small>
                {photoError && <small className="field-error">{photoError}</small>}
              </div>
            </div>
          )}

          <div className="form-grid">
            <label className={`form-field ${errors.name ? 'invalid' : ''}`}>
              <span>Full name</span>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Priya Sharma" autoComplete="name" />
              <Err k="name" />
            </label>
            <label className={`form-field ${errors.email ? 'invalid' : ''}`}>
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              <Err k="email" />
            </label>
            <label className={`form-field ${errors.phone ? 'invalid' : ''}`}>
              <span>Phone</span>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="98765 43210" autoComplete="tel" />
              <Err k="phone" />
            </label>
            <label className={`form-field ${errors.location ? 'invalid' : ''}`}>
              <span>Location</span>
              <select value={form.location} onChange={set('location')}>
                <option value="">Select your area</option>
                {LOCATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <Err k="location" />
            </label>

            {role === 'worker' && (
              <>
                <label className={`form-field ${errors.experience ? 'invalid' : ''}`}>
                  <span>Experience (years)</span>
                  <input type="number" min="0" max="50" value={form.experience} onChange={set('experience')} placeholder="e.g. 5" />
                  <Err k="experience" />
                </label>
                <label className={`form-field ${errors.hourlyRate ? 'invalid' : ''}`}>
                  <span>Hourly charge (₹)</span>
                  <input type="number" min="80" max="1000" step="10" value={form.hourlyRate} onChange={set('hourlyRate')} />
                  <Err k="hourlyRate" />
                </label>
              </>
            )}

            <label className={`form-field ${errors.password ? 'invalid' : ''}`}>
              <span>Password</span>
              <input type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete="new-password" />
              <Err k="password" />
            </label>
            <label className={`form-field ${errors.confirm ? 'invalid' : ''}`}>
              <span>Confirm password</span>
              <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
              <Err k="confirm" />
            </label>
          </div>

          {role === 'worker' && (
            <>
              <fieldset className={`form-field ${errors.skills ? 'invalid' : ''}`}>
                <legend>Skills &amp; services</legend>
                <div className="toggle-chips">
                  {SERVICES.map((s) => (
                    <button type="button" key={s.id} className={form.skills.includes(s.id) ? 'active' : ''} onClick={() => toggle('skills', s.id)} aria-pressed={form.skills.includes(s.id)}>
                      <Icon name={s.icon} size={16} /> {s.name}
                    </button>
                  ))}
                </div>
                <Err k="skills" />
              </fieldset>
              <fieldset className="form-field">
                <legend>Languages you speak</legend>
                <div className="toggle-chips">
                  {LANGUAGES.map((l) => (
                    <button type="button" key={l} className={form.languages.includes(l) ? 'active' : ''} onClick={() => toggle('languages', l)} aria-pressed={form.languages.includes(l)}>
                      {l}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg">
            Create {role === 'worker' ? 'helper' : 'customer'} account
          </button>
          <p className="auth-switch">
            Already have an account? <Link to={`/login?role=${role}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
