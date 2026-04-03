import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('syncspace_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getProfile()
        .then(data => {
          setUser(data.Profile);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('syncspace_token');
          setToken(null);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ Email: email, Password: password });
    localStorage.setItem('syncspace_token', data.token);
    setToken(data.token);
    return data;
  };

  const register = async (email, password, username) => {
    const data = await api.register({ Email: email, Password: password, UserName: username });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('syncspace_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const data = await api.getProfile();
    setUser(data.Profile);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
