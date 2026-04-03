import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import ResourceCard from '../components/ResourceCard';
import { getBookmarks } from '../utils/bookmarks';
import { Bookmark } from 'lucide-react';
import './Dashboard.css';

export default function Bookmarks() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchBookmarkedResources();
  }, []);

  const fetchBookmarkedResources = async () => {
    try {
      const bookmarkIds = getBookmarks();
      if (bookmarkIds.length === 0) {
        setResources([]);
        setLoading(false);
        return;
      }
      // Fetch recents and filter by bookmarks (since we don't have a dedicated endpoint)
      const data = await api.getRecentResources();
      const allResources = data.resources || [];
      const bookmarked = allResources.filter(r => bookmarkIds.includes(r._id));
      setResources(bookmarked);
    } catch (err) {
      toast.error('Failed to load bookmarks');
    }
    setLoading(false);
  };

  const handleVote = async (resourceId, type) => {
    try {
      if (type === 'up') await api.upvoteResource(resourceId);
      else await api.downvoteResource(resourceId);
      fetchBookmarkedResources();
    } catch (err) {
      toast.error('Vote failed');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Bookmarks</h1>
          <p className="page-subtitle">Your saved resources</p>
        </div>
      </div>

      <div className="dashboard-section animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : resources.length === 0 ? (
          <div className="empty-state glass">
            <Bookmark size={48} strokeWidth={1} />
            <h3>No bookmarks yet</h3>
            <p>Click the bookmark icon on any resource to save it here.</p>
          </div>
        ) : (
          <div className="resources-grid">
            {resources.map((r, i) => (
              <ResourceCard
                key={r._id}
                resource={r}
                onVote={handleVote}
                canDelete={false}
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
