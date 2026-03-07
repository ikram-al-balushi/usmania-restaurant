import { createContext, useContext, useState, useCallback } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || null);

  const login = useCallback(async (password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    const { token: newToken } = await res.json();
    sessionStorage.setItem('adminToken', newToken);
    setToken(newToken);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('adminToken');
    setToken(null);
  }, []);

  const adminFetch = useCallback(async (url, opts = {}) => {
    const isFormData = opts.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...opts.headers,
      Authorization: `Bearer ${token}`,
    };
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401) {
      sessionStorage.removeItem('adminToken');
      setToken(null);
      throw new Error('Session expired');
    }
    return res;
  }, [token]);

  return (
    <AdminContext.Provider value={{ token, isAdmin: !!token, login, logout, adminFetch }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}
