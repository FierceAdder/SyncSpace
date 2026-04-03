import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import ResourceCard from '../components/ResourceCard';
import { Search as SearchIcon, X } from 'lucide-react';
import './Search.css';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (q) => {
    if (!q?.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.searchResources(q.trim());
      setResults(data.resources || []);
    } catch (err) {
      toast.error('Search failed');
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    performSearch(query);
  };

  const handleVote = async (resourceId, type) => {
    try {
      if (type === 'up') await api.upvoteResource(resourceId);
      else await api.downvoteResource(resourceId);
      performSearch(query);
    } catch (err) {
      toast.error('Vote failed');
    }
  };

  const handleDelete = async (resourceId) => {
    try {
      await api.deleteResource(resourceId);
      toast.success('Resource deleted');
      performSearch(query);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="search-page">
      <div className="search-page-header animate-fade-in-up">
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Find resources across all your groups</p>
      </div>

      <form className="search-form animate-fade-in-up" onSubmit={handleSubmit} style={{ animationDelay: '0.1s' }}>
        <SearchIcon size={20} className="search-form-icon" />
        <input
          className="search-form-input"
          placeholder="Search by name, category, or content…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button type="button" className="search-clear" onClick={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <X size={18} />
          </button>
        )}
      </form>

      <div className="search-results" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : searched && results.length === 0 ? (
          <div className="empty-state glass">
            <SearchIcon size={48} strokeWidth={1} />
            <h3>No results found</h3>
            <p>Try a different search term or check your spelling.</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="results-count">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
            <div className="resources-grid">
              {results.map((r, i) => (
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
          </>
        ) : null}
      </div>
    </div>
  );
}
