import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, SlidersHorizontal, ArrowUpDown, Clock, ThumbsUp, Sparkles } from 'lucide-react';
import api from '../api/api';
import ResourceCard from '../components/ResourceCard';
import ArticleViewer from '../components/ArticleViewer';
import { isBookmarked, toggleBookmark } from '../utils/bookmarks';
import { useToast } from '../context/ToastContext';
import './Search.css';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', icon: Sparkles },
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'upvotes', label: 'Most Upvoted', icon: ThumbsUp },
];

function SkeletonCard() {
  return (
    <div className="skeleton-card glass">
      <div className="skeleton-thumb skeleton-shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line short skeleton-shimmer" />
        <div className="skeleton-line skeleton-shimmer" />
        <div className="skeleton-line mid skeleton-shimmer" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewingArticle, setViewingArticle] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const toast = useToast();
  const inputRef = useRef(null);
  const sortRef = useRef(null);

  // Auto-search on mount if ?q= param exists
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, sortBy);
    }
    inputRef.current?.focus();
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const performSearch = async (q, sort) => {
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.searchResources(q.trim(), sort);
      setResults(data.resources || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    performSearch(query, sortBy);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSortDropdown(false);
    if (query.trim()) performSearch(query, value);
  };

  const handleVote = async (resourceId, type) => {
    try {
      if (type === 'up') await api.upvoteResource(resourceId);
      else await api.downvoteResource(resourceId);
      if (query.trim()) performSearch(query, sortBy);
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

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  const activeSortOption = SORT_OPTIONS.find(o => o.value === sortBy);

  return (
    <div className="search-page">
      <div className="animate-fade-in-up">
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Find resources across all your groups</p>
      </div>

      <div className="search-controls animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <form className="search-form" onSubmit={handleSearch}>
          <SearchIcon size={18} className="search-form-icon" />
          <input
            ref={inputRef}
            className="search-form-input"
            placeholder="Search by name, category, content..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="search-clear" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
        </form>

        {/* Sort Dropdown */}
        <div className="search-sort-wrapper" ref={sortRef}>
          <button
            className="search-sort-btn glass"
            onClick={() => setShowSortDropdown(s => !s)}
          >
            <ArrowUpDown size={14} />
            <span>{activeSortOption?.label}</span>
          </button>
          {showSortDropdown && (
            <div className="search-sort-dropdown glass">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`search-sort-option ${sortBy === opt.value ? 'active' : ''}`}
                  onClick={() => handleSortChange(opt.value)}
                >
                  <opt.icon size={14} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="search-results-area animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="resources-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="empty-state glass">
            <SearchIcon size={48} strokeWidth={1} />
            <h3>No results found</h3>
            <p>Try different keywords or check your group memberships.</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="results-count">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
            <div className="resources-grid">
              {results.map((r, i) => (
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
          </>
        ) : (
          <div className="search-empty-hint">
            <SlidersHorizontal size={36} strokeWidth={1} />
            <p>Search across all your groups.<br />Use the sort to find the most relevant results.</p>
          </div>
        )}
      </div>

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
