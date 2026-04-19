import { useEffect, useState, useRef } from 'react';
import { Users, Crown, FileText, ThumbsUp, TrendingUp } from 'lucide-react';
import api from '../api/api';
import ResourceCard from '../components/ResourceCard';
import StatsDetailModal from '../components/StatsDetailModal';
import ArticleViewer from '../components/ArticleViewer';
import { isBookmarked, toggleBookmark } from '../utils/bookmarks';
import { useToast } from '../context/ToastContext';
import './Dashboard.css';

function AnimatedCounter({ target, duration = 1200 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function Dashboard() {
  const toast = useToast();
  const [resources, setResources] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsModal, setStatsModal] = useState(null); // 'joined' | 'owned' | null
  const [viewingArticle, setViewingArticle] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resData, profData] = await Promise.all([
          api.getRecentResources(),
          api.getProfile()
        ]);
        setResources(resData.resources || []);
        setProfile(profData.Profile);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVote = async (resourceId, type) => {
    try {
      if (type === 'up') await api.upvoteResource(resourceId);
      else await api.downvoteResource(resourceId);
      const data = await api.getRecentResources();
      setResources(data.resources || []);
    } catch {
      toast.error('Vote failed');
    }
  };

  const handleDownload = async (resourceId) => {
    try {
      const data = await api.getPresignedDownloadUrl(resourceId);
      window.open(data.downloadUrl, '_blank');
    } catch {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  }

  const stats = [
    {
      icon: Users,
      label: 'Groups Joined',
      value: profile?.Groups_Part_Of || 0,
      color: 'hsl(210, 100%, 55%)',
      bg: 'hsla(210, 100%, 55%, 0.12)',
      clickable: true,
      onClick: () => setStatsModal('joined'),
    },
    {
      icon: Crown,
      label: 'Groups Owned',
      value: profile?.Groups_Owned || 0,
      color: 'hsl(38, 95%, 55%)',
      bg: 'hsla(38, 95%, 55%, 0.12)',
      clickable: true,
      onClick: () => setStatsModal('owned'),
    },
    {
      icon: FileText,
      label: 'Resources Shared',
      value: profile?.Resources_Count || 0,
      color: 'hsl(280, 80%, 60%)',
      bg: 'hsla(280, 80%, 60%, 0.12)',
    },
    {
      icon: ThumbsUp,
      label: 'Total Upvotes',
      value: profile?.Total_Upvotes || 0,
      color: 'hsl(142, 71%, 45%)',
      bg: 'hsla(142, 71%, 45%, 0.12)',
    },
  ];

  return (
    <div className="dashboard">
      <div className="animate-fade-in-up">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {profile?.Username} 👋</p>
      </div>

      <div className="stats-grid animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`stat-card glass ${s.clickable ? 'stat-card-interactive' : ''}`}
            style={{ animationDelay: `${i * 0.08}s` }}
            onClick={s.onClick}
            role={s.clickable ? 'button' : undefined}
            tabIndex={s.clickable ? 0 : undefined}
          >
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">
                <AnimatedCounter target={s.value} />
              </span>
              <span className="stat-label">{s.label}</span>
            </div>
            {s.clickable && (
              <div className="stat-card-hint">
                <TrendingUp size={12} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="section-title">Recent Resources</h2>
        {resources.length === 0 ? (
          <div className="empty-state glass">
            <FileText size={48} strokeWidth={1} />
            <h3>No recent resources</h3>
            <p>Join a group and start sharing resources to see them here.</p>
          </div>
        ) : (
          <div className="resources-grid">
            {resources.map((r, i) => (
              <ResourceCard
                key={r._id}
                resource={r}
                onVote={handleVote}
                showGroup
                onViewArticle={(res) => setViewingArticle(res)}
                onDownload={handleDownload}
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Stats Modal */}
      <StatsDetailModal
        isOpen={!!statsModal}
        onClose={() => setStatsModal(null)}
        statType={statsModal === 'owned' ? 'owned' : 'joined'}
      />

      {/* Article Viewer */}
      <ArticleViewer
        resource={viewingArticle}
        isOpen={!!viewingArticle}
        onClose={() => setViewingArticle(null)}
        onVote={handleVote}
        onBookmark={(id) => toggleBookmark(id)}
        bookmarked={viewingArticle ? isBookmarked(viewingArticle._id) : false}
      />
    </div>
  );
}
