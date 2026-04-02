import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Spinner, ErrorMsg } from '../components/UI';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ Email: '', Password: '', UserName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { saveToken } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await login({ Email: form.Email, Password: form.Password });
        saveToken(data.token);
        navigate('/dashboard');
      } else {
        await register({ Email: form.Email, Password: form.Password, UserName: form.UserName });
        setMode('login');
        setForm(f => ({ ...f, UserName: '' }));
        setError('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setForm({ Email: '', Password: '', UserName: '' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-900 border-r border-zinc-800 p-12">
        <div>
          <Logo />
        </div>
        <div>
          <blockquote className="font-display text-3xl font-bold text-zinc-100 leading-tight mb-6">
            Share knowledge.<br />
            <span className="text-zinc-500">Stay in sync.</span>
          </blockquote>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
            Create or join groups, share resources, and collaborate — everything your team needs in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-zinc-700" />
          <span className="text-zinc-600 font-mono text-xs">SYNCSPACE / {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          {/* Tab switcher */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8">
            {['login', 'register'].map(tab => (
              <button
                key={tab}
                onClick={() => switchMode(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize
                  ${mode === tab
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="animate-slide-up">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
                <input
                  className="input-base"
                  placeholder="your_username"
                  value={form.UserName}
                  onChange={update('UserName')}
                  required
                  autoComplete="username"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                className="input-base"
                type="email"
                placeholder="you@example.com"
                value={form.Email}
                onChange={update('Email')}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                className="input-base"
                type="password"
                placeholder="••••••••"
                value={form.Password}
                onChange={update('Password')}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && <ErrorMsg message={error} />}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-zinc-300 hover:text-white transition-colors font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#18181b" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#18181b" opacity="0.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#18181b" opacity="0.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#18181b" />
      </svg>
    </div>
    <span className="font-display text-xl font-bold text-zinc-100 tracking-tight">SyncSpace</span>
  </div>
);
