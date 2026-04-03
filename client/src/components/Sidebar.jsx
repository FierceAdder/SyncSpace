import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, UserPlus, LayoutDashboard, Bookmark, ChevronLeft, ChevronRight, Crown, Users } from 'lucide-react';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import Modal from './Modal';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
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

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      await api.createGroup(groupName.trim());
      toast.success('Group created successfully!');
      setGroupName('');
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

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
            <div className="logo-icon">S</div>
            {!collapsed && <span className="logo-text">SyncSpace</span>}
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
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="sidebar-divider" />

          <div className={`sidebar-groups-header ${collapsed ? 'collapsed' : ''}`}>
            {!collapsed && <span className="section-label">Your Groups</span>}
            <div className={`group-actions-mini ${collapsed ? 'stacked' : ''}`}>
              <button className="icon-btn" onClick={() => setShowCreate(true)} title="Create Group">
                <Plus size={16} />
              </button>
              <button className="icon-btn" onClick={() => setShowJoin(true)} title="Join Group">
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          <div className="sidebar-groups-list">
            {groups.length === 0 && !collapsed && (
              <p className="no-groups">No groups yet. Create or join one!</p>
            )}
            {groups.map(g => (
              <button
                key={g._id}
                className={`group-item ${location.pathname === `/groups/${g._id}` ? 'active' : ''}`}
                onClick={() => navigate(`/groups/${g._id}`)}
                title={g.Group_Name}
              >
                <Avatar name={g.Group_Name} size={28} />
                {!collapsed && (
                  <div className="group-item-info">
                    <span className="group-item-name">{g.Group_Name}</span>
                    <span className="group-item-meta">
                      {g.isOwner && <Crown size={10} />}
                      <Users size={10} /> {g.memberCount}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
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
        <button className="mobile-nav-item" onClick={() => setShowCreate(true)}>
          <Plus size={20} />
          <span>Create</span>
        </button>
      </nav>

      {/* Create Group Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create a Group" size="sm">
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
