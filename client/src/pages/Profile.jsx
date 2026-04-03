import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import Avatar from '../components/Avatar';
import { Edit3, Check, X, Lock, Mail, FolderOpen, Users } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, refreshProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.Username || '');
  const [nameLoading, setNameLoading] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername === user?.Username) {
      setEditingName(false);
      return;
    }
    setNameLoading(true);
    try {
      await api.updateUsername(newUsername.trim());
      await refreshProfile();
      toast.success('Username updated!');
      setEditingName(false);
    } catch (err) {
      toast.error(err.message);
    }
    setNameLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setPassLoading(true);
    try {
      await api.updatePassword(oldPassword, newPassword);
      toast.success('Password changed!');
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message);
    }
    setPassLoading(false);
  };

  return (
    <div className="profile-page">
      <h1 className="page-title animate-fade-in-up">Profile</h1>

      <div className="profile-card glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="profile-card-top">
          <Avatar name={user?.Username} size={80} />
          <div className="profile-card-info">
            {editingName ? (
              <div className="edit-name-row">
                <input
                  className="input-field"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateUsername(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button className="icon-btn" onClick={handleUpdateUsername} disabled={nameLoading}>
                  {nameLoading ? <span className="spinner" /> : <Check size={16} />}
                </button>
                <button className="icon-btn" onClick={() => { setEditingName(false); setNewUsername(user?.Username || ''); }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="profile-name-row">
                <h2>{user?.Username}</h2>
                <button className="icon-btn" onClick={() => setEditingName(true)} title="Edit username">
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            <div className="profile-email">
              <Mail size={14} /> {user?.Email}
            </div>
          </div>
        </div>

        <div className="profile-stats-row">
          <div className="profile-stat">
            <FolderOpen size={18} />
            <span className="profile-stat-value">{user?.Groups_Owned || 0}</span>
            <span className="profile-stat-label">Groups Owned</span>
          </div>
          <div className="profile-stat">
            <Users size={18} />
            <span className="profile-stat-value">{user?.Groups_Part_Of || 0}</span>
            <span className="profile-stat-label">Groups Joined</span>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="profile-section glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="profile-section-header">
          <div>
            <h3><Lock size={16} /> Change Password</h3>
            <p>Update your account password</p>
          </div>
          {!showPasswordForm && (
            <button className="btn-secondary" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form className="password-form" onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input className="input-field" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input className="input-field" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button className="btn-primary" type="submit" disabled={passLoading}>
                {passLoading ? <span className="spinner" /> : 'Update Password'}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setShowPasswordForm(false); setOldPassword(''); setNewPassword(''); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Logout */}
      <div className="profile-section glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="profile-section-header">
          <div>
            <h3 style={{ color: 'var(--color-error)' }}>Log Out</h3>
            <p>Sign out of your SyncSpace account on this device</p>
          </div>
          <button className="btn-danger" onClick={() => { logout(); navigate('/'); }}>Log Out</button>
        </div>
      </div>
    </div>
  );
}
