import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getGroupResources, addResource, leaveGroup, deleteGroup } from '../utils/api';
import { ResourceCard } from '../components/ResourceCard';
import { Spinner, Toast, ErrorMsg, Skeleton, EmptyState, Modal } from '../components/UI';

const RESOURCE_TYPES = ['Link', 'Note', 'Video', 'File', 'Other'];

const EMPTY_FORM = {
  Name: '',
  Resource_Type: 'Link',
  Content: '',
  Category: '',
};

export default function GroupFeed() {
  const { groupId } = useParams();
  const { isTokenValid, logout, userId } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [joinCodeDisplay, setJoinCodeDisplay] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!isTokenValid()) { navigate('/'); return; }
    fetchResources();
  }, [groupId]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getGroupResources(groupId);
      const list = data.resources || [];
      setResources(list);
      if (list.length > 0 && list[0].Group_Posted_In) {
        // Try to get group name from first resource if populated
      }
    } catch (err) {
      if (err.message?.includes('403')) showToast('Not a member of this group.', 'error');
      else showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
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
      await fetchResources();
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

  const handleDelete = async () => {
    if (!window.confirm('Delete this group and all its resources?')) return;
    setActionLoading(true);
    try {
      await deleteGroup(groupId);
      showToast('Group deleted.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setActionLoading(false); }
  };

  const handleResourceDelete = (id) => {
    setResources(prev => prev.filter(r => r._id !== id));
    showToast('Resource deleted.', 'success');
  };

  const categories = ['All', ...new Set(resources.map(r => r.Category).filter(Boolean))];
  const filtered = filter === 'All' ? resources : resources.filter(r => r.Category === filter);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/dashboard" className="text-zinc-500 hover:text-zinc-100 transition-colors text-sm flex items-center gap-1.5">
            <span>←</span>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-zinc-700">/</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-zinc-100 truncate">
              {loading ? '...' : (resources[0]?.Group_Posted_In?.Group_Name || `Group`)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="btn-primary text-xs px-4 py-2"
            >
              + Add Resource
            </button>
            <div className="relative group">
              <button className="btn-ghost text-xl leading-none px-2 py-1.5">···</button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 min-w-40 animate-scale-in">
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full text-left px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                >
                  Leave group
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950 transition-colors"
                >
                  Delete group
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Group info bar */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-800/60">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-display font-bold text-zinc-300 text-lg">
              {loading ? '?' : (resources[0]?.Group_Posted_In?.Group_Name?.[0]?.toUpperCase() || '#')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">Group ID</span>
                <code className="font-mono text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">{groupId.slice(-8)}</code>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">{resources.length} resource{resources.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Add resource form */}
        {showAddForm && (
          <div className="card p-5 mb-6 animate-slide-up border-zinc-700">
            <h3 className="font-display font-semibold text-zinc-200 mb-4 text-sm uppercase tracking-wider">New Resource</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Name *</label>
                  <input className="input-base" placeholder="Resource title" value={form.Name} onChange={update('Name')} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Type</label>
                  <select
                    className="input-base"
                    value={form.Resource_Type}
                    onChange={update('Resource_Type')}
                  >
                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Content / URL *</label>
                <textarea
                  className="input-base resize-none"
                  rows={3}
                  placeholder={form.Resource_Type === 'Link' ? 'https://...' : 'Enter content, notes, or description...'}
                  value={form.Content}
                  onChange={update('Content')}
                  required
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

        {/* Category filter */}
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

        {/* Resources */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
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
                onUpdate={fetchResources}
                onDelete={handleResourceDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Leave Modal */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Leave Group">
        <p className="text-zinc-400 text-sm mb-5">Are you sure you want to leave this group? You'll need a join code to rejoin.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowLeaveModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={handleLeave} disabled={actionLoading} className="btn-danger border border-red-900/50 flex items-center gap-2">
            {actionLoading && <Spinner size="sm" />} Leave Group
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
