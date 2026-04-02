import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getProfile, updateUsername, updatePassword } from '../utils/api';
import { Spinner, Toast, ErrorMsg, Skeleton } from '../components/UI';

export default function Profile() {
  const { isTokenValid, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Username form
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Password form
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!isTokenValid()) { navigate('/'); return; }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data.Profile);
      setNewUsername(data.Profile.Username || '');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setUsernameError(''); setUsernameLoading(true);
    try {
      await updateUsername({ newUsername });
      setProfile(p => ({ ...p, Username: newUsername }));
      showToast('Username updated!', 'success');
    } catch (err) {
      setUsernameError(err.message);
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { setPwError("New passwords don't match."); return; }
    if (pwForm.newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    setPwError(''); setPwLoading(true);
    try {
      await updatePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
      showToast('Password changed!', 'success');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/dashboard" className="text-zinc-500 hover:text-zinc-100 transition-colors text-sm flex items-center gap-1.5">
            <span>←</span>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="font-display font-bold text-zinc-100 flex-1">Profile</h1>
          <button
            onClick={handleLogout}
            className="btn-ghost text-xs text-red-500 hover:text-red-400 hover:bg-red-950/50"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar / Info card */}
        <div className="card p-6 animate-fade-in">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-display font-bold text-3xl text-zinc-300">
                {profile?.Username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-xl text-zinc-100">{profile?.Username}</h2>
                <p className="text-zinc-500 text-sm">{profile?.Email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-6 text-center">
                <Stat label="Groups Owned" value={profile?.Groups_Owned ?? 0} />
                <Stat label="Groups In" value={profile?.Groups_Part_Of ?? 0} />
              </div>
            </div>
          )}
          {/* Mobile stats */}
          {profile && (
            <div className="flex sm:hidden items-center justify-around mt-4 pt-4 border-t border-zinc-800">
              <Stat label="Groups Owned" value={profile?.Groups_Owned ?? 0} />
              <Stat label="Groups In" value={profile?.Groups_Part_Of ?? 0} />
            </div>
          )}
        </div>

        {/* Update username */}
        <section className="card p-6 animate-slide-up">
          <h3 className="font-display font-semibold text-zinc-200 mb-1">Change Username</h3>
          <p className="text-zinc-600 text-sm mb-5">Your display name across all groups.</p>
          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">New Username</label>
              <input
                className="input-base"
                placeholder="Enter new username"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {usernameError && <ErrorMsg message={usernameError} />}
            <div className="flex justify-end">
              <button type="submit" disabled={usernameLoading || loading} className="btn-primary flex items-center gap-2">
                {usernameLoading && <Spinner size="sm" />}
                Update Username
              </button>
            </div>
          </form>
        </section>

        {/* Update password */}
        <section className="card p-6 animate-slide-up">
          <h3 className="font-display font-semibold text-zinc-200 mb-1">Change Password</h3>
          <p className="text-zinc-600 text-sm mb-5">Use a strong password you don't use elsewhere.</p>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Current Password</label>
              <input
                className="input-base"
                type="password"
                placeholder="••••••••"
                value={pwForm.oldPassword}
                onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">New Password</label>
                <input
                  className="input-base"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Confirm New</label>
                <input
                  className="input-base"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            {pwError && <ErrorMsg message={pwError} />}
            <div className="flex justify-end">
              <button type="submit" disabled={pwLoading} className="btn-primary flex items-center gap-2">
                {pwLoading && <Spinner size="sm" />}
                Change Password
              </button>
            </div>
          </form>
        </section>

        {/* Danger zone */}
        <section className="card p-6 border-red-950/50 animate-slide-up">
          <h3 className="font-display font-semibold text-red-400 mb-1">Sign Out</h3>
          <p className="text-zinc-600 text-sm mb-4">You'll need to sign back in to access SyncSpace.</p>
          <button onClick={handleLogout} className="btn-danger border border-red-900/50 text-sm">
            Sign out of SyncSpace
          </button>
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="text-center">
    <div className="font-display font-bold text-2xl text-zinc-100">{value}</div>
    <div className="text-zinc-600 text-xs mt-0.5 whitespace-nowrap">{label}</div>
  </div>
);
