import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import ResourceCard from '../components/ResourceCard';
import { TrendingUp, Users, FolderOpen, Activity } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchRecents();
  }, []);

  const fetchRecents = async () => {
    try {
      const data = await api.getRecentResources();
      setResources(data.resources || []);
    } catch (err) {
      toast.error('Failed to load recent resources');
    }
    setLoading(false);
  };

  const handleVote = async (resourceId, type) => {
    try {
      if (type === 'up') await api.upvoteResource(resourceId);
      else await api.downvoteResource(resourceId);
      fetchRecents();
    } catch (err) {
      toast.error('Vote failed');
    }
  };

  const handleDelete = async (resourceId) => {
    try {
      await api.deleteResource(resourceId);
      toast.success('Resource deleted');
      fetchRecents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const stats = [
    { icon: FolderOpen, label: 'Groups Owned', value: user?.Groups_Owned || 0, color: 'var(--color-accent)' },
    { icon: Users, label: 'Groups Joined', value: user?.Groups_Part_Of || 0, color: 'var(--color-cyan)' },
    { icon: Activity, label: 'Recent Activity', value: resources.length, color: 'var(--color-success)' },
    { icon: TrendingUp, label: 'Total Votes', value: resources.reduce((sum, r) => sum + (r.Upvotes?.length || 0) + (r.Downvotes?.length || 0), 0), color: 'var(--color-warning)' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Welcome back, <span className="text-gradient">{user?.Username || 'User'}</span></h1>
          <p className="page-subtitle">Here's what's happening across your groups</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card glass animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Resources */}
      <div className="dashboard-section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="section-title">Recent Resources</h2>
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : resources.length === 0 ? (
          <div className="empty-state glass">
            <FolderOpen size={48} strokeWidth={1} />
            <h3>No resources yet</h3>
            <p>Join a group and start sharing resources to see them here.</p>
          </div>
        ) : (
          <div className="resources-grid">
            {resources.map((r, i) => (
              <ResourceCard
                key={r._id}
                resource={r}
                onVote={handleVote}
                onDelete={handleDelete}
                canDelete={true}
                showGroup={true}
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
