import { useState, useEffect, useRef } from 'react';
import { Mail, Calendar, Shield, Pencil, Check, X, Lock, Eye, EyeOff, Camera, FileText, ThumbsUp, Lightbulb, Bug, Clock, ChevronDown, Save } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import FeedbackModal from '../components/FeedbackModal';
import './Profile.css';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Username editing
  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // About editing
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [aboutLoading, setAboutLoading] = useState(false);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Avatar
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef(null);

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [myFeedback, setMyFeedback] = useState([]);
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchFeedback();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data.Profile);
      setAboutText(data.Profile?.About || '');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const fetchFeedback = async () => {
    try {
      const data = await api.getMyFeedback();
      setMyFeedback(data.feedback || []);
    } catch {}
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;
    setNameLoading(true);
    try {
      await api.updateUsername(newUsername.trim());
      toast.success('Username updated!');
      setEditingName(false);
      refreshProfile();
      fetchProfile();
    } catch (err) {
      toast.error(err.message);
    }
    setNameLoading(false);
  };

  const handleUpdateAbout = async () => {
    setAboutLoading(true);
    try {
      await api.updateProfile(aboutText.trim().slice(0, 250));
      toast.success('Bio updated!');
      setEditingAbout(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.message);
    }
    setAboutLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      await api.updatePassword(oldPassword, newPassword);
      toast.success('Password changed!');
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message);
    }
    setPasswordLoading(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed');
      return;
    }

    setAvatarLoading(true);
    try {
      const data = await api.updateAvatar(file.name, file.type);
      // Upload directly to S3
      await api.uploadToS3(data.uploadUrl, file, file.type);
      toast.success('Avatar updated!');
      refreshProfile();
      fetchProfile();
    } catch (err) {
      toast.error('Avatar upload failed');
    }
    setAvatarLoading(false);
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  }

  if (!profile) return null;

  const joinedDate = profile.Joined_At
    ? new Date(profile.Joined_At).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="profile-page">
      <div className="animate-fade-in-up">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account details</p>
      </div>

      {/* Profile Card */}
      <div className="profile-card glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="profile-card-top">
          <div className="profile-avatar-wrapper" onClick={() => avatarInputRef.current?.click()}>
            <Avatar name={profile.Username} src={profile.Avatar_Url} size={72} />
            <div className="profile-avatar-overlay">
              {avatarLoading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <Camera size={18} />}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="profile-card-info">
            {editingName ? (
              <div className="edit-name-row">
                <input
                  className="input-field"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="New username"
                  autoFocus
                />
                <button className="btn-primary" style={{ padding: '6px 12px' }} disabled={nameLoading} onClick={handleUpdateUsername}>
                  {nameLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                </button>
                <button className="btn-ghost" style={{ padding: '6px' }} onClick={() => setEditingName(false)}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="profile-name-row">
                <h2>{profile.Username}</h2>
                <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => { setNewUsername(profile.Username); setEditingName(true); }}>
                  <Pencil size={13} />
                </button>
              </div>
            )}
            <div className="profile-email">
              <Mail size={14} />
              <span>{profile.Email}</span>
            </div>
            {joinedDate && (
              <div className="profile-joined">
                <Calendar size={13} />
                <span>Joined {joinedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* About section */}
        <div className="profile-about">
          <div className="profile-about-header">
            <span className="profile-about-label">About</span>
            {!editingAbout ? (
              <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setEditingAbout(true)}>
                <Pencil size={11} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} disabled={aboutLoading} onClick={handleUpdateAbout}>
                  {aboutLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <><Save size={11} /> Save</>}
                </button>
                <button className="btn-ghost" style={{ padding: '4px 6px' }} onClick={() => { setEditingAbout(false); setAboutText(profile.About || ''); }}>
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
          {editingAbout ? (
            <div>
              <textarea
                className="input-field"
                value={aboutText}
                onChange={e => setAboutText(e.target.value.slice(0, 250))}
                placeholder="Tell others about yourself..."
                rows={3}
                style={{ resize: 'vertical' }}
                autoFocus
              />
              <span className="profile-about-count">{aboutText.length}/250</span>
            </div>
          ) : (
            <p className="profile-about-text">
              {profile.About || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>No bio yet. Click Edit to add one.</span>}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="profile-stats-row">
          <div className="profile-stat">
            <span className="profile-stat-value">{profile.Groups_Part_Of}</span>
            <span className="profile-stat-label">Groups</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{profile.Groups_Owned}</span>
            <span className="profile-stat-label">Owned</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{profile.Resources_Count || 0}</span>
            <span className="profile-stat-label">Resources</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{profile.Total_Upvotes || 0}</span>
            <span className="profile-stat-label">Upvotes</span>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="profile-section glass animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="profile-section-header">
          <div>
            <h3><Lightbulb size={16} /> Feedback</h3>
            <p>Request features or report bugs</p>
          </div>
          <button className="btn-secondary" onClick={() => setShowFeedback(true)}>
            Submit Feedback
          </button>
        </div>
        {myFeedback.length > 0 && (
          <div className="profile-feedback-history">
            <button className="profile-feedback-toggle" onClick={() => setShowFeedbackHistory(s => !s)}>
              Your submissions ({myFeedback.length})
              <ChevronDown size={14} className={showFeedbackHistory ? 'rotated' : ''} />
            </button>
            {showFeedbackHistory && (
              <div className="profile-feedback-list">
                {myFeedback.map((f, i) => (
                  <div key={f._id} className="profile-feedback-item" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {f.Type === 'feature_request' ? <Lightbulb size={13} /> : <Bug size={13} />}
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.Title}</span>
                      <span className={`feedback-status-badge ${f.Status}`}>{f.Status.replace('_', ' ')}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{f.Description}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Clock size={10} /> {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="profile-section glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="profile-section-header">
          <div>
            <h3><Shield size={16} /> Security</h3>
            <p>Manage your password</p>
          </div>
          <button className="btn-secondary" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>
        {showPasswordForm && (
          <form className="password-form" onSubmit={handleChangePassword}>
            <div>
              <label className="feedback-label">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  className="input-field"
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowOldPass(!showOldPass)}>
                  {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="feedback-label">New Password</label>
              <div className="password-input-wrapper">
                <input
                  className="input-field"
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowNewPass(!showNewPass)}>
                  {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button className="btn-primary" disabled={passwordLoading} style={{ width: '100%' }}>
              {passwordLoading ? <span className="spinner" /> : <><Lock size={16} /> Update Password</>}
            </button>
          </form>
        )}
      </div>

      <FeedbackModal isOpen={showFeedback} onClose={() => { setShowFeedback(false); fetchFeedback(); }} />
    </div>
  );
}
