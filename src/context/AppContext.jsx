import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EVENTS, STORAGE_KEYS } from '../data/constants.js';
import * as db from '../utils/storage.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  // Re-render consumers whenever localStorage data changes
  // (from React, from the AngularJS module, or from another tab).
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const onStorage = (e) => {
      if (!e.key || Object.values(STORAGE_KEYS).includes(e.key)) bump();
    };
    window.addEventListener(EVENTS.dataChanged, bump);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENTS.dataChanged, bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const userId = db.getSessionUserId();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const user = useMemo(() => (userId ? db.getUser(userId) : null), [userId, version]);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
  }, []);

  const toast = useCallback(
    (message, type = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      timers.current[id] = setTimeout(() => dismissToast(id), 3800);
    },
    [dismissToast]
  );

  const login = useCallback((email, password) => {
    const res = db.authenticate(email, password);
    if (res.user) db.setSession(res.user.id);
    return res;
  }, []);

  const logout = useCallback(() => db.clearSession(), []);

  const value = useMemo(
    () => ({ user, version, login, logout, toast, toasts, dismissToast, db }),
    [user, version, login, logout, toast, toasts, dismissToast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
