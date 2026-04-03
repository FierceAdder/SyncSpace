import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const location = useLocation();
  const hoverTimer = useRef(null);

  const isGroupPage = location.pathname.startsWith('/groups/');

  // Auto-collapse sidebar when navigating to a group page
  useEffect(() => {
    if (isGroupPage) {
      setCollapsed(true);
      setHoverExpanded(false);
    }
  }, [location.pathname]);

  // Debounced hover expand — 180ms delay prevents flicker when cursor skims the edge
  const handleSidebarMouseEnter = useCallback(() => {
    if (isGroupPage && collapsed) {
      hoverTimer.current = setTimeout(() => setHoverExpanded(true), 180);
    }
  }, [isGroupPage, collapsed]);

  const handleSidebarMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    if (isGroupPage) setHoverExpanded(false);
  }, [isGroupPage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sidebarExpanded = !collapsed || hoverExpanded;
  const sidebarWidth = sidebarExpanded ? 'var(--sidebar-width)' : '68px';

  return (
    <div className="layout">
      <Sidebar
        collapsed={!sidebarExpanded}
        onToggle={() => { setCollapsed(!collapsed); setHoverExpanded(false); }}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        hoverExpanded={hoverExpanded}
      />
      <Header collapsed={!sidebarExpanded} />
      <main
        className="main-content"
        style={{ marginLeft: sidebarWidth, transition: 'margin-left var(--transition-normal)' }}
      >
        <Outlet />
      </main>
    </div>
  );
}
