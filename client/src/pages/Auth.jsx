import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Sun, Moon } from 'lucide-react';
import './Auth.css';

export default function Auth() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const [mode, setMode] = useState(isRegister ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(email, password, username);
        toast.success('Account created! Please log in.');
        setMode('login');
        setPassword('');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setPassword('');
    navigate(mode === 'login' ? '/register' : '/login', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-visual" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="auth-visual-bg">
          <div className="auth-glow auth-glow-1" />
          <div className="auth-glow auth-glow-2" />
        </div>
        <div className="auth-visual-content">
          <div className="landing-logo-icon" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>S</div>
          <h2>SyncSpace</h2>
          <p>Share. Discover. Learn Together.</p>
          <span className="auth-back-hint">← Back to Home</span>
        </div>
      </div>

      <div className="auth-form-side">
        <button className="auth-theme-toggle theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p>
              {mode === 'login'
                ? 'Sign in to your SyncSpace account'
                : 'Start sharing resources with your groups'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group animate-fade-in-up">
                <label>Username</label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Your display name"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  className="input-field"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={toggleMode} className="auth-switch-btn">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
