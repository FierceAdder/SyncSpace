import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getGroupResources, addResource, leaveGroup, deleteGroup,
  getGroupDetails, getGroupMembers, kickMember, regenerateJoinCode
} from '../utils/api';
import { ResourceCard } from '../components/ResourceCard';
import { Spinner, Toast, ErrorMsg, Skeleton, EmptyState, Modal } from '../components/UI';

const RESOURCE_TYPES = ['Link', 'Note', 'Video', 'File', 'Other'];
const EMPTY_FORM = { Name: '', Resource_Type: 'Link', Content: '', Category: '' };

export default function GroupFeed() {
  const { groupId } = useParams();
  const { isTokenValid, userId } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();

  const [resources, setResources] = useState([]);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showMembersMobile, setShowMembersMobile] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [kickingId, setKickingId] = useState(null);
  const [codeVisible, setCodeVisible] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!isTokenValid()) { navigate('/'); return; }
    fetchAll();
  }, [groupId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resourcesData, groupData] = await Promise.all([
        getGroupResources(groupId),
        getGroupDetails(groupId)
      ]);
      setResources(resourcesData.resources || []);
      setGroup(groupData.group);
    } catch (err) {
      if (err.message?.includes('403')) showToast('Not a member of this group.', 'error');
      else showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const data = await getGroupMembers(groupId);
      setMembers(data.members || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleOpenMembers = () => {
    setShowMembersPanel(true);
    setShowMembersMobile(true);
    if (members.length === 0) fetchMembers();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.Name.trim() || !form.Content.trim()) { setFormError('Name and content are required.'); return; }
    setFormError(''); setAddLoading(true);
    try {
      await addResource({ ...form, groupToPost: groupId });
      showToast('Resource added!', 'success');
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      await fetchAll();
    } catch (err) { setFormError(err.message); }
    finally { setAddLoading(false); }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await leaveGroup(groupId);
      showToast('Left group.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
      setShowLeaveModal(false);
    } finally { setActionLoading(false); }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Delete this group and all its resources? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await deleteGroup(groupId);
      showToast('Group deleted.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setActionLoading(false); }
  };

  const handleKick = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this group?`)) return;
    setKickingId(memberId);
    try {
      await kickMember(groupId, memberId);
      setMembers(prev => prev.filter(m => m._id !== memberId));
      setGroup(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : prev);
      showToast(`${memberName} removed.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setKickingId(null); }
  };

  const handleRegenCode = async () => {
    if (!window.confirm('Generate a new join code? The old one will stop working immediately.')) return;
    setRegenLoading(true);
    try {
      const data = await regenerateJoinCode(groupId);
      setGroup(prev => prev ? { ...prev, Join_Code: data.Join_Code } : prev);
      showToast('New join code generated!', 'success');
      setCodeVisible(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setRegenLoading(false); }
  };

  const handleResourceDelete = (id) => {
    setResources(prev => prev.filter(r => r._id !== id));
    showToast('Resource deleted.', 'success');
  };

  const categories = ['All', ...new Set(resources.map(r => r.Category).filter(Boolean))];
  const filtered = filter === 'All' ? resources : resources.filter(r => r.Category === filter);
  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const isOwner = group?.isOwner;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/dashboard" className="text-zinc-500 hover:text-zinc-100 transition-colors text-sm flex items-center gap-1.5 shrink-0">
            <span>←</span>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-zinc-700">/</span>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            {loading ? (
              <div className="h-5 w-32 shimmer rounded" />
            ) : (
              <>
                <h1 className="font-display font-bold text-zinc-100 truncate">{group?.Group_Name || 'Group'}</h1>
                {isOwner && (
                  <span className="font-mono text-[10px] text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5 shrink-0">owner</span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleOpenMembers} className="btn-ghost text-xs flex items-center gap-1.5">
              <span>👥</span>
              <span className="hidden sm:inline">{group?.memberCount ?? '…'}</span>
            </button>
            <button onClick={() => setShowAddForm(v => !v)} className="btn-primary text-xs px-3 py-2">
              + Add
            </button>

            {/* ··· menu */}
            <div className="relative group/menu">
              <button className="btn-ghost px-2 py-1.5 text-lg leading-none">···</button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block z-20 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 min-w-48 animate-scale-in">
                {isOwner && (
                  <>
                    <button
                      onClick={() => setCodeVisible(v => !v)}
                      className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      {codeVisible ? 'Hide' : 'Show'} join code
                    </button>
                    <button
                      onClick={handleRegenCode}
                      disabled={regenLoading}
                      className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      {regenLoading ? <Spinner size="sm" /> : '↻'} Regenerate code
                    </button>
                    <div className="my-1 border-t border-zinc-700" />
                    <button
                      onClick={handleDeleteGroup}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950 transition-colors"
                    >
                      Delete group
                    </button>
                  </>
                )}
                {!isOwner && (
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="w-full text-left px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-700 transition-colors"
                  >
                    Leave group
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Main feed */}
        <div className="flex-1 min-w-0">

          {/* Info bar */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-800/60 flex-wrap gap-y-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-display font-bold text-zinc-300 text-lg shrink-0">
                {loading ? '?' : (group?.Group_Name?.[0]?.toUpperCase() || '#')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600 text-xs">ID</span>
                  <code className="font-mono text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">{groupId.slice(-8)}</code>
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {resources.length} resource{resources.length !== 1 ? 's' : ''} · {group?.memberCount ?? '…'} member{group?.memberCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Join code chip — owner only */}
            {isOwner && codeVisible && group?.Join_Code && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 animate-scale-in">
                <span className="text-zinc-500 text-xs">Join code</span>
                <code className="font-mono font-bold text-zinc-100 tracking-widest text-base">{group.Join_Code}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(group.Join_Code); showToast('Copied!', 'success'); }}
                  className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors"
                  title="Copy"
                >
                  ⎘
                </button>
              </div>
            )}
          </div>

          {/* Add resource form */}
          {showAddForm && (
            <div className="card p-5 mb-6 border-zinc-700 animate-slide-up">
              <h3 className="font-display font-semibold text-zinc-200 mb-4 text-sm uppercase tracking-wider">New Resource</h3>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Name *</label>
                    <input className="input-base" placeholder="Resource title" value={form.Name} onChange={update('Name')} required autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Type</label>
                    <select className="input-base" value={form.Resource_Type} onChange={update('Resource_Type')}>
                      {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Content / URL *</label>
                  <textarea
                    className="input-base resize-none" rows={3}
                    placeholder={form.Resource_Type === 'Link' ? 'https://...' : 'Enter content or notes...'}
                    value={form.Content} onChange={update('Content')} required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Category</label>
                  <input className="input-base" placeholder="e.g. Design, Backend, Tutorial..." value={form.Category} onChange={update('Category')} />
                </div>
                {formError && <ErrorMsg message={formError} />}
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={() => { setShowAddForm(false); setFormError(''); setForm(EMPTY_FORM); }} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={addLoading} className="btn-primary flex items-center gap-2">
                    {addLoading && <Spinner size="sm" />} Add Resource
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Category filters */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`shrink-0 font-mono text-xs px-3 py-1.5 rounded-lg border transition-all duration-150
                    ${filter === cat
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                      : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Resource list */}
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📂"
              title={filter !== 'All' ? 'No resources in this category' : 'No resources yet'}
              subtitle={filter !== 'All' ? 'Try a different filter' : 'Add the first resource to this group'}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <ResourceCard
                  key={r._id}
                  resource={r}
                  currentUserId={userId}
                  onUpdate={fetchAll}
                  onDelete={handleResourceDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Members sidebar — desktop */}
        {showMembersPanel && (
          <aside className="w-60 shrink-0 hidden lg:block animate-slide-in-right">
            <div className="sticky top-20 card p-4">
              <MembersPanel
                members={members}
                loading={membersLoading}
                isOwner={isOwner}
                currentUserId={userId}
                kickingId={kickingId}
                onKick={handleKick}
                onClose={() => setShowMembersPanel(false)}
                onRefresh={fetchMembers}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Members modal — mobile */}
      <Modal isOpen={showMembersMobile} onClose={() => setShowMembersMobile(false)} title={`Members · ${group?.memberCount ?? ''}`}>
        <div className="lg:hidden">
          <MembersPanel
            members={members}
            loading={membersLoading}
            isOwner={isOwner}
            currentUserId={userId}
            kickingId={kickingId}
            onKick={handleKick}
            onClose={() => setShowMembersMobile(false)}
            onRefresh={fetchMembers}
          />
        </div>
      </Modal>

      {/* Leave modal */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Leave Group">
        <p className="text-zinc-400 text-sm mb-5">Are you sure? You'll need a join code to rejoin.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowLeaveModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={handleLeave} disabled={actionLoading} className="btn-danger border border-red-900/50 flex items-center gap-2">
            {actionLoading && <Spinner size="sm" />} Leave
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

// ─── Members Panel ───────────────────────────────────────────────────────────

const MembersPanel = ({ members, loading, isOwner, currentUserId, kickingId, onKick, onClose, onRefresh }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-display font-semibold text-zinc-200 text-sm">Members</h3>
      <div className="flex items-center gap-1">
        <button onClick={onRefresh} className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors p-1" title="Refresh">↻</button>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors p-1">✕</button>
      </div>
    </div>

    {loading ? (
      <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}</div>
    ) : members.length === 0 ? (
      <p className="text-zinc-600 text-xs text-center py-4">No members loaded</p>
    ) : (
      <div className="space-y-0.5 max-h-96 overflow-y-auto">
        {members.map(m => (
          <div key={m._id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-800/50 group/member transition-colors">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
              {m.UserName?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 truncate leading-tight">{m.UserName}</p>
              {m.isOwner && <span className="font-mono text-[10px] text-zinc-600">owner</span>}
            </div>
            {isOwner && m._id !== currentUserId && !m.isOwner && (
              <button
                onClick={() => onKick(m._id, m.UserName)}
                disabled={kickingId === m._id}
                className="opacity-0 group-hover/member:opacity-100 text-zinc-600 hover:text-red-400 text-xs transition-all p-0.5"
                title={`Remove ${m.UserName}`}
              >
                {kickingId === m._id ? <Spinner size="sm" /> : '✕'}
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
