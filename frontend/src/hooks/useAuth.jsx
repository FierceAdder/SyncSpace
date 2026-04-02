import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ss_token'));
  const [userId, setUserId] = useState(() => {
    try {
      const t = localStorage.getItem('ss_token');
      if (!t) return null;
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.id;
    } catch { return null; }
  });

  const saveToken = useCallback((newToken) => {
    localStorage.setItem('ss_token', newToken);
    setToken(newToken);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUserId(payload.id);
    } catch { setUserId(null); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ss_token');
    setToken(null);
    setUserId(null);
  }, []);

  const isTokenValid = useCallback(() => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, userId, saveToken, logout, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
