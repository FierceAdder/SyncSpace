import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Sun, Moon, ScrollText } from 'lucide-react';
import Modal from '../components/Modal';
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
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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

            {mode === 'register' && (
              <label className="auth-terms-checkbox animate-fade-in-up">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                />
                <span>
                  I agree to the{' '}
                  <button type="button" className="auth-terms-link" onClick={() => setShowTerms(true)}>Terms of Service & Privacy Policy</button>
                </span>
              </label>
            )}

            <button className="btn-primary" disabled={loading || (mode === 'register' && !agreedTerms)} style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {mode === 'login' && (
              <p className="auth-terms-notice">
                By signing in, you agree to our{' '}
                <button type="button" className="auth-terms-link" onClick={() => setShowTerms(true)}>Terms of Service</button>.
              </p>
            )}
          </form>

          <div className="auth-switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={toggleMode} className="auth-switch-btn">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* Terms of Service Modal */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Service & Privacy Policy" size="lg">
        <div className="terms-content">
          <p className="terms-updated">Last updated: April 2026</p>

          <h4>1. Acceptance of Terms</h4>
          <p>By creating an account or using SyncSpace, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform.</p>

          <h4>2. User Accounts</h4>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to update it as necessary. You must be at least 13 years old to use SyncSpace.</p>

          <h4>3. Content Ownership & Copyright</h4>
          <p>You retain ownership of content you upload. However, by uploading content to SyncSpace, you represent and warrant that:</p>
          <ul>
            <li>You own or have the necessary rights, licenses, and permissions to share the content.</li>
            <li>The content does not infringe upon any third party's intellectual property rights, including copyrights, trademarks, or trade secrets.</li>
            <li>You grant SyncSpace a non-exclusive, royalty-free license to host and display the content to authorized group members.</li>
          </ul>

          <h4>4. Acceptable Use</h4>
          <p>You agree not to:</p>
          <ul>
            <li>Upload copyrighted material without authorization (pirated textbooks, proprietary lectures, etc.).</li>
            <li>Share content that is illegal, harmful, threatening, abusive, or otherwise objectionable.</li>
            <li>Attempt to gain unauthorized access to other accounts or systems.</li>
            <li>Use the platform for commercial purposes without permission.</li>
          </ul>

          <h4>5. DMCA & Copyright Takedown</h4>
          <p>SyncSpace respects intellectual property rights. If you believe content on the platform infringes your copyright, you may submit a takedown request. We will promptly review and remove infringing content. Repeat infringers will have their accounts terminated.</p>

          <h4>6. Privacy</h4>
          <p>We collect and store your email, username, and account activity data. Uploaded files are stored securely on AWS S3. We do not sell your data to third parties. We may use anonymized, aggregate data to improve the platform.</p>

          <h4>7. Limitation of Liability</h4>
          <p>SyncSpace is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform, including loss of data or unauthorized access to your account.</p>

          <h4>8. Termination</h4>
          <p>We reserve the right to suspend or terminate your account at any time for violations of these terms. You may delete your account at any time.</p>

          <h4>9. Changes to Terms</h4>
          <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>

          <div className="terms-footer">
            <button className="btn-primary" onClick={() => setShowTerms(false)} style={{ width: '100%' }}>
              I Understand
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
