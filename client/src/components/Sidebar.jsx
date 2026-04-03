import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, UserPlus, LayoutDashboard, Bookmark, ChevronLeft, ChevronRight, Crown, Users, FolderOpen, X } from 'lucide-react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import Modal from './Modal';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle, onMouseEnter, onMouseLeave, hoverExpanded }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showGroupsSheet, setShowGroupsSheet] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const fetchGroups = async () => {
    try {
      const data = await api.getMyGroups();
      setGroups(data.groups || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchGroups(); }, []);
  useEffect(() => { setShowGroupsSheet(false); }, [location.pathname]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      await api.createGroup(groupName.trim(), groupDescription.trim());
      toast.success('Group created successfully!');
      setGroupName('');
      setGroupDescription('');
      setShowCreate(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      await api.joinGroup(joinCode.trim());
      toast.success('Joined group successfully!');
      setJoinCode('');
      setShowJoin(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  ];

  const isGroupActive = location.pathname.startsWith('/groups/');

  return (
    <>
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${hoverExpanded ? 'hover-expanded' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="sidebar-inner">
          {/* Logo — always rendered, text fades via CSS */}
          <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
            <div className="logo-icon">S</div>
            <span className="logo-text sidebar-label">SyncSpace</span>
          </div>

          <button className="sidebar-toggle-top" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <item.icon size={18} />
                {/* Always rendered — CSS hides when collapsed */}
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-divider" />

          <div className="sidebar-groups-header">
            <span className="section-label sidebar-label">Your Groups</span>
            {/* Always in a row — never stacked — fits within 68px */}
            <div className="group-actions-mini">
              <button className="icon-btn" onClick={() => setShowCreate(true)} title="Create Group">
                <Plus size={16} />
              </button>
              <button className="icon-btn" onClick={() => setShowJoin(true)} title="Join Group">
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          <div className="sidebar-groups-list">
            {groups.length === 0 && (
              <p className="no-groups sidebar-label">No groups yet. Create or join one!</p>
            )}
            {groups.map(g => (
              <button
                key={g._id}
                className={`group-item ${location.pathname === `/groups/${g._id}` ? 'active' : ''}`}
                onClick={() => navigate(`/groups/${g._id}`)}
                title={g.Group_Name}
              >
                <Avatar name={g.Group_Name} size={28} />
                {/* Always rendered — CSS hides when collapsed */}
                <div className="group-item-info sidebar-label">
                  <span className="group-item-name">{g.Group_Name}</span>
                  <span className="group-item-meta">
                    {g.isOwner && <Crown size={10} />}
                    <Users size={10} /> {g.memberCount}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-logo" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon" style={{ width: 30, height: 30, fontSize: '0.9rem' }}>S</div>
        </div>
        {navItems.map(item => (
          <button
            key={item.path}
            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={`mobile-nav-item ${isGroupActive || showGroupsSheet ? 'active' : ''}`}
          onClick={() => setShowGroupsSheet(s => !s)}
        >
          <FolderOpen size={20} />
          <span>Groups</span>
        </button>
        <button className="mobile-nav-item" onClick={() => setShowCreate(true)}>
          <Plus size={20} />
          <span>Create</span>
        </button>
        <button className="mobile-nav-item" onClick={() => setShowJoin(true)}>
          <UserPlus size={20} />
          <span>Join</span>
        </button>
      </nav>

      {/* Mobile Groups Bottom Sheet */}
      {showGroupsSheet && (
        <div className="groups-sheet-overlay" onClick={() => setShowGroupsSheet(false)}>
          <div className="groups-sheet" onClick={e => e.stopPropagation()}>
            <div className="groups-sheet-header">
              <span className="groups-sheet-title">Your Groups</span>
              <button className="groups-sheet-close" onClick={() => setShowGroupsSheet(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="groups-sheet-body">
              {groups.length === 0 ? (
                <div className="groups-sheet-empty">
                  <FolderOpen size={36} strokeWidth={1.2} />
                  <p>No groups yet.</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => { setShowGroupsSheet(false); setShowCreate(true); }}>
                      <Plus size={14} /> Create
                    </button>
                    <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => { setShowGroupsSheet(false); setShowJoin(true); }}>
                      <UserPlus size={14} /> Join
                    </button>
                  </div>
                </div>
              ) : (
                groups.map(g => (
                  <button
                    key={g._id}
                    className={`groups-sheet-item ${location.pathname === `/groups/${g._id}` ? 'active' : ''}`}
                    onClick={() => { navigate(`/groups/${g._id}`); setShowGroupsSheet(false); }}
                  >
                    <Avatar name={g.Group_Name} size={36} />
                    <div className="groups-sheet-item-info">
                      <span className="groups-sheet-item-name">{g.Group_Name}</span>
                      <span className="groups-sheet-item-meta">
                        {g.isOwner && <><Crown size={11} /> Owner · </>}
                        <Users size={11} /> {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setGroupName(''); setGroupDescription(''); }} title="Create a Group" size="sm">
        <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block' }}>
              Group Name
            </label>
            <input
              className="input-field"
              placeholder="e.g., CS101 Study Group"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></span>
              <span style={{ opacity: 0.5 }}>{groupDescription.length}/100</span>
            </label>
            <input
              className="input-field"
              placeholder="What is this group about?"
              value={groupDescription}
              onChange={e => setGroupDescription(e.target.value.slice(0, 100))}
            />
          </div>
          <button className="btn-primary" disabled={loading || !groupName.trim()} style={{ width: '100%' }}>
            {loading ? <span className="spinner" /> : 'Create Group'}
          </button>
        </form>
      </Modal>

      {/* Join Group Modal */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join a Group" size="sm">
        <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block' }}>
              Join Code
            </label>
            <input
              className="input-field"
              placeholder="Enter 6-character code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              maxLength={6}
              style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '0.3em', fontFamily: 'var(--font-mono)' }}
              autoFocus
            />
          </div>
          <button className="btn-primary" disabled={loading || joinCode.length < 6} style={{ width: '100%' }}>
            {loading ? <span className="spinner" /> : 'Join Group'}
          </button>
        </form>
      </Modal>
    </>
  );
}
