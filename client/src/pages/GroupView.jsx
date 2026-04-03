import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import ResourceCard from '../components/ResourceCard';
import MemberCard from '../components/MemberCard';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Copy, RefreshCw, Trash2, LogOut, Plus, Link, Play, FileText, Check, Pencil, Save, X } from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import './GroupView.css';

export default function GroupView() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [group, setGroup] = useState(null);
  const [resources, setResources] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('resources');
  const [loading, setLoading] = useState(true);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Inline group info editing
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Add resource form
  const [resType, setResType] = useState('link');
  const [resName, setResName] = useState('');
  const [resContent, setResContent] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resCategory, setResCategory] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchGroup();
    fetchResources();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const data = await api.getGroup(groupId);
      setGroup(data.group);
    } catch (err) {
      toast.error(err.message);
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const fetchResources = async () => {
    try {
      const data = await api.getGroupResources(groupId);
      setResources(data.resources || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await api.getMembers(groupId);
      setMembers(data.members || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
  }, [activeTab, groupId]);

  const handleCopyCode = async () => {
    await copyToClipboard(group.Join_Code);
    setCodeCopied(true);
    toast.success('Join code copied!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    try {
      const data = await api.regenerateCode(groupId);
      setGroup(prev => ({ ...prev, Join_Code: data.Join_Code }));
      toast.success('Join code regenerated!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.deleteGroup(groupId);
      toast.success('Group deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await api.leaveGroup(groupId);
      toast.success('Left group');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await api.removeMember(groupId, memberId);
      toast.success('Member removed');
      fetchMembers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleVote = async (resourceId, type) => {
    try {
      if (type === 'up') await api.upvoteResource(resourceId);
      else await api.downvoteResource(resourceId);
      fetchResources();
    } catch (err) {
      toast.error('Vote failed');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await api.deleteResource(resourceId);
      toast.success('Resource deleted');
      fetchResources();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const data = await api.updateGroup(groupId, {
        Group_Name: editName.trim(),
        Description: editDesc.trim(),
      });
      // Update local state immediately so header reflects changes
      setGroup(prev => ({
        ...prev,
        Group_Name: data.group.Group_Name,
        Description: data.group.Description,
      }));
      toast.success('Group updated!');
      setIsEditingInfo(false);
    } catch (err) {
      toast.error(err.message);
    }
    setEditLoading(false);
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.addResource({
        groupToPost: groupId,
        Resource_Type: resType,
        Name: resName,
        Content: resContent,
        Description: resDescription,
        Category: resCategory,
      });
      toast.success('Resource added!');
      setShowAddResource(false);
      setResName('');
      setResContent('');
      setResDescription('');
      setResCategory('');
      fetchResources();
    } catch (err) {
      toast.error(err.message);
    }
    setAddLoading(false);
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  }

  if (!group) return null;

  const tabs = ['resources', 'members', ...(group.isOwner ? ['settings'] : [])];

  return (
    <div className="group-view">
      {/* Group Header */}
      <div className="group-header glass animate-fade-in-up">
        <div className="group-header-info">
          <h1 className="group-title">{group.Group_Name}</h1>
          {group.Description && (
            <p className="group-description">{group.Description}</p>
          )}
          <div className="group-meta-row">
            <span className="group-meta-item">
              👥 {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </span>
            <span className="group-meta-item">
              {group.isOwner ? '👑 You own this group' : `Owner: ${group.Owner?.UserName}`}
            </span>
          </div>
        </div>
        <div className="group-header-actions">
          <button className="join-code-btn glass" onClick={handleCopyCode}>
            <span className="join-code-label">JOIN CODE</span>
            <span className="join-code-value">{group.Join_Code}</span>
            {codeCopied ? <Check size={14} className="copy-check" /> : <Copy size={14} />}
          </button>
          {!group.isOwner && (
            <button className="btn-secondary" onClick={() => setShowLeaveConfirm(true)}>
              <LogOut size={16} /> Leave
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="group-tabs animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`group-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="group-tab-content animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {activeTab === 'resources' && (
          <>
            {resources.length === 0 ? (
              <div className="empty-state glass">
                <FileText size={48} strokeWidth={1} />
                <h3>No resources yet</h3>
                <p>Be the first to share a resource in this group!</p>
                <button className="btn-primary" onClick={() => setShowAddResource(true)}>
                  <Plus size={16} /> Add Resource
                </button>
              </div>
            ) : (
              <div className="resources-grid">
                {resources.map((r, i) => (
                  <ResourceCard
                    key={r._id}
                    resource={r}
                    onVote={handleVote}
                    onDelete={handleDeleteResource}
                    canDelete={true}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <div className="members-list">
            {members.map((m, i) => (
              <MemberCard
                key={m._id}
                member={m}
                isGroupOwner={group.isOwner}
                onRemove={handleRemoveMember}
                style={{ animation: `fadeInUp 0.4s ease both`, animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
        )}

        {activeTab === 'settings' && group.isOwner && (
          <div className="group-settings">
            {/* Group Info card */}
            <div className="settings-card glass">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <h3>Group Info</h3>
                {!isEditingInfo ? (
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px 10px', fontSize: '0.8rem', gap: '4px' }}
                    onClick={() => { setEditName(group.Group_Name); setEditDesc(group.Description || ''); setIsEditingInfo(true); }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                      onClick={handleUpdateGroup}
                      disabled={editLoading || !editName.trim()}
                    >
                      {editLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Save size={13} /> Save</>}
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ padding: '4px 8px' }}
                      onClick={() => setIsEditingInfo(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {!isEditingInfo ? (
                <>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{group.Group_Name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {group.Description || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No description set.</span>}
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Group Name</label>
                    <input
                      className="input-field"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Group name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></span>
                      <span style={{ opacity: 0.5 }}>{editDesc.length}/100</span>
                    </label>
                    <input
                      className="input-field"
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value.slice(0, 100))}
                      placeholder="What is this group about?"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Join Code card */}
            <div className="settings-card glass">
              <h3>Join Code</h3>
              <p>Share this code with others to let them join your group.</p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                <button className="btn-secondary" onClick={() => setShowRegenConfirm(true)}>
                  <RefreshCw size={16} /> Regenerate Code
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-card glass" style={{ borderColor: 'hsla(0, 85%, 60%, 0.2)' }}>
              <h3 style={{ color: 'var(--color-error)' }}>Danger Zone</h3>
              <p>Deleting this group will permanently remove all resources and members.</p>
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)} style={{ marginTop: 'var(--space-md)' }}>
                <Trash2 size={16} /> Delete Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Add Resource Button */}
      <button className="fab" onClick={() => setShowAddResource(true)} title="Add Resource">
        <Plus size={24} />
      </button>

      {/* Add Resource Modal */}
      <Modal isOpen={showAddResource} onClose={() => setShowAddResource(false)} title="Add a Resource" size="md">
        <form onSubmit={handleAddResource} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>Type</label>
            <div className="type-selector">
              {[
                { value: 'link', icon: Link, label: 'Link' },
                { value: 'video', icon: Play, label: 'Video' },
                { value: 'note', icon: FileText, label: 'Note' },
              ].map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-option ${resType === t.value ? 'active' : ''}`}
                  onClick={() => setResType(t.value)}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block' }}>Name</label>
            <input className="input-field" placeholder="Resource name" value={resName} onChange={e => setResName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></span>
              <span style={{ opacity: 0.5 }}>{resDescription.length}/100</span>
            </label>
            <input
              className="input-field"
              placeholder="Brief summary of this resource"
              value={resDescription}
              onChange={e => setResDescription(e.target.value.slice(0, 100))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block' }}>
              {resType === 'note' ? 'Content' : 'URL'}
            </label>
            {resType === 'note' ? (
              <textarea className="input-field" placeholder="Write your note…" value={resContent} onChange={e => setResContent(e.target.value)} rows={4} style={{ resize: 'vertical' }} required />
            ) : (
              <input className="input-field" placeholder="https://..." value={resContent} onChange={e => setResContent(e.target.value)} required />
            )}
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block' }}>Category</label>
            <input className="input-field" placeholder="e.g., Lecture Notes, Tutorials" value={resCategory} onChange={e => setResCategory(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={addLoading} style={{ width: '100%' }}>
            {addLoading ? <span className="spinner" /> : <><Plus size={16} /> Add Resource</>}
          </button>
        </form>
      </Modal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message="This will permanently delete the group and all its resources. This action cannot be undone."
        confirmText="Delete Group"
        danger
      />
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveGroup}
        title="Leave Group"
        message="You'll lose access to all resources in this group. You can rejoin using the join code."
        confirmText="Leave Group"
        danger
      />
      <ConfirmDialog
        isOpen={showRegenConfirm}
        onClose={() => setShowRegenConfirm(false)}
        onConfirm={handleRegenerateCode}
        title="Regenerate Join Code"
        message="This will invalidate the current join code. Anyone who has the old code will no longer be able to use it to join."
        confirmText="Regenerate"
        danger
      />
    </div>
  );
}
