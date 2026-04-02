import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getRecentResources, searchResources,
  createGroup, joinGroup, deleteGroup, leaveGroup, getProfile
} from '../utils/api';
import { ResourceCard } from '../components/ResourceCard';
import { Spinner, Toast, Modal, ErrorMsg, Skeleton, EmptyState } from '../components/UI';

export default function Dashboard() {
  const { isTokenValid, logout, userId } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [recents, setRecents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const searchRef = useRef(null);
  const searchDebounce = useRef(null);

  useEffect(() => {
    if (!isTokenValid()) { navigate('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, recentsData] = await Promise.all([getProfile(), getRecentResources()]);
      setProfile(profileData.Profile);
      setRecents(recentsData.resources || []);
      // Build unique groups list from recents
      const groupMap = {};
      (recentsData.resources || []).forEach(r => {
        if (r.Group_Posted_In?._id) groupMap[r.Group_Posted_In._id] = r.Group_Posted_In;
      });
      setGroups(Object.values(groupMap));
    } catch (err) {
      if (err.message?.includes('401') || err.message?.toLowerCase().includes('token')) {
        logout(); navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((q) => {
    clearTimeout(searchDebounce.current);
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchResources(q);
        setSearchResults(data.resources || []);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setModalLoading(true); setModalError('');
    try {
      await createGroup({ Group_Name: groupName });
      showToast('Group created!', 'success');
      setShowCreateModal(false); setGroupName('');
      await loadData();
    } catch (err) { setModalError(err.message); }
    finally { setModalLoading(false); }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setModalLoading(true); setModalError('');
    try {
      await joinGroup({ Join_Code: joinCode });
      showToast('Joined group!', 'success');
      setShowJoinModal(false); setJoinCode('');
      await loadData();
    } catch (err) { setModalError(err.message); }
    finally { setModalLoading(false); }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group and all its resources?')) return;
    try {
      await deleteGroup(groupId);
      showToast('Group deleted.', 'success');
      await loadData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await leaveGroup(groupId);
      showToast('Left group.', 'success');
      await loadData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const displayedResources = searchResults !== null ? searchResults : recents;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-zinc-100 rounded-md flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#18181b" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#18181b" opacity="0.5" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#18181b" opacity="0.5" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#18181b" />
              </svg>
            </div>
            <span className="font-display font-bold text-zinc-100 text-base tracking-tight hidden sm:block">SyncSpace</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
              <input
                className="input-base pl-8 py-2 text-sm"
                placeholder="Search resources across all groups..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner size="sm" className="text-zinc-500" />
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Link to="/profile" className="btn-ghost flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                {profile?.Username?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="hidden sm:block text-sm">{profile?.Username || '...'}</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Groups</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreateModal(true); setModalError(''); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 text-xs transition-all"
              >
                <span>+</span> New
              </button>
              <button
                onClick={() => { setShowJoinModal(true); setModalError(''); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 text-xs transition-all"
              >
                <span>→</span> Join
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : groups.length === 0 ? (
              <p className="text-zinc-600 text-xs text-center py-4">No groups yet</p>
            ) : (
              <div className="space-y-1">
                {groups.map(g => (
                  <SidebarGroup
                    key={g._id}
                    group={g}
                    onDelete={handleDeleteGroup}
                    onLeave={handleLeaveGroup}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main feed */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display text-xl font-bold text-zinc-100">
                {isSearching ? 'Search Results' : 'Recent Activity'}
              </h1>
              {isSearching && (
                <p className="text-zinc-500 text-sm mt-0.5">
                  {searchLoading ? 'Searching...' : `${displayedResources.length} result${displayedResources.length !== 1 ? 's' : ''} for "${searchQuery}"`}
                </p>
              )}
            </div>
            {isSearching && (
              <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="btn-ghost text-xs">
                Clear search
              </button>
            )}
          </div>

          {/* Mobile group actions */}
          <div className="flex gap-2 mb-4 md:hidden">
            <button onClick={() => { setShowCreateModal(true); setModalError(''); }} className="btn-ghost text-xs border border-zinc-800 flex-1">+ New Group</button>
            <button onClick={() => { setShowJoinModal(true); setModalError(''); }} className="btn-ghost text-xs border border-zinc-800 flex-1">→ Join Group</button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : displayedResources.length === 0 ? (
            <EmptyState
              icon={isSearching ? '🔍' : '📭'}
              title={isSearching ? 'No results found' : 'Nothing here yet'}
              subtitle={isSearching ? 'Try a different query' : 'Join groups and resources will appear here'}
            />
          ) : (
            <div className="space-y-3">
              {displayedResources.map(r => (
                <ResourceCard
                  key={r._id}
                  resource={r}
                  currentUserId={userId}
                  onUpdate={loadData}
                  onDelete={() => setRecents(prev => prev.filter(x => x._id !== r._id))}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Group Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Group Name</label>
            <input
              className="input-base"
              placeholder="e.g. React Devs, Design Team..."
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              required autoFocus
            />
          </div>
          {modalError && <ErrorMsg message={modalError} />}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={modalLoading} className="btn-primary flex items-center gap-2">
              {modalLoading && <Spinner size="sm" />} Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Group Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Group">
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Join Code</label>
            <input
              className="input-base font-mono tracking-widest text-center text-lg"
              placeholder="ABC123"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              required autoFocus
            />
            <p className="text-zinc-600 text-xs mt-1.5">Enter the 6-character code shared by the group owner.</p>
          </div>
          {modalError && <ErrorMsg message={modalError} />}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowJoinModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={modalLoading} className="btn-primary flex items-center gap-2">
              {modalLoading && <Spinner size="sm" />} Join
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

const SidebarGroup = ({ group, onDelete, onLeave }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="group/item relative">
      <Link
        to={`/group/${group._id}`}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
      >
        <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
          {group.Group_Name?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm truncate flex-1">{group.Group_Name}</span>
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(v => !v); }}
          className="opacity-0 group-hover/item:opacity-100 text-zinc-600 hover:text-zinc-300 text-xs px-1 rounded transition-all"
        >
          ···
        </button>
      </Link>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 min-w-36 animate-scale-in">
          <Link
            to={`/group/${group._id}`}
            className="block px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Open feed
          </Link>
          <button
            onClick={() => { onLeave(group._id); setMenuOpen(false); }}
            className="w-full text-left px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            Leave group
          </button>
          <button
            onClick={() => { onDelete(group._id); setMenuOpen(false); }}
            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950 transition-colors"
          >
            Delete group
          </button>
        </div>
      )}
    </div>
  );
};
