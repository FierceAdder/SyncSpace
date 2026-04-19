import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, User, LogOut, ExternalLink, FileText, Link as LinkIcon, Play, X, PenLine, FileIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';
import Avatar from './Avatar';
import './Header.css';

export default function Header({ collapsed }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileRef = useRef(null);
  const debounceRef = useRef(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // ⌘K / Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic search as user types (debounced 300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.searchResources(searchQuery.trim());
        setSearchResults(data.resources || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      }
      setSearchLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Close search results and profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleViewAllResults = () => {
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'link': return <LinkIcon size={14} />;
      case 'video': return <Play size={14} />;
      case 'article': return <PenLine size={14} />;
      case 'file': return <FileIcon size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <header className="header" style={{ left: collapsed ? '68px' : 'var(--sidebar-width)' }}>
      <div className="header-search" ref={searchRef}>
        <Search size={16} className="search-icon" />
        <input
          ref={searchInputRef}
          className="search-input"
          placeholder="Search resources… (⌘K)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchQuery.trim() && searchResults.length > 0) setShowResults(true); }}
          onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) handleViewAllResults(); }}
        />
        {searchQuery && (
          <button className="search-input-clear" onClick={clearSearch}>
            <X size={14} />
          </button>
        )}
        {searchLoading && <div className="spinner search-spinner" />}

        {/* Live search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="search-dropdown glass">
            <div className="search-dropdown-header">
              <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
            </div>
            {searchResults.slice(0, 6).map(r => (
              <button
                key={r._id}
                className="search-result-item"
                onClick={() => {
                  if (r.Resource_Type?.toLowerCase() === 'link' || r.Resource_Type?.toLowerCase() === 'video') {
                    window.open(r.Content, '_blank');
                  } else if (r.Group_Posted_In?._id) {
                    navigate(`/groups/${r.Group_Posted_In._id}`);
                  }
                  setShowResults(false);
                }}
              >
                <div className="search-result-icon">{getTypeIcon(r.Resource_Type)}</div>
                <div className="search-result-info">
                  <span className="search-result-name">{r.Name || r.Original_title || 'Untitled'}</span>
                  <span className="search-result-meta">
                    {r.Category && <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{r.Category}</span>}
                    {r.Group_Posted_In?.Group_Name && <span>{r.Group_Posted_In.Group_Name}</span>}
                  </span>
                </div>
                {(r.Resource_Type?.toLowerCase() === 'link' || r.Resource_Type?.toLowerCase() === 'video') && (
                  <ExternalLink size={12} className="search-result-ext" />
                )}
              </button>
            ))}
            <button className="search-view-all" onClick={handleViewAllResults}>
              View all results <ArrowRight size={14} />
            </button>
          </div>
        )}
        {showResults && searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
          <div className="search-dropdown glass">
            <div className="search-no-results">No results found</div>
          </div>
        )}
      </div>

      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="profile-menu-wrapper" ref={profileRef}>
          <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
            <Avatar name={user?.Username} src={user?.Avatar_Url} size={32} />
          </button>

          {showProfile && (
              <div className="profile-dropdown glass">
                <div className="profile-dropdown-header">
                  <Avatar name={user?.Username} src={user?.Avatar_Url} size={40} />
                  <div>
                    <div className="profile-dropdown-name">{user?.Username}</div>
                    <div className="profile-dropdown-email">{user?.Email}</div>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item" onClick={() => { navigate('/profile'); setShowProfile(false); }}>
                  <User size={16} /> Profile
                </button>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
}
