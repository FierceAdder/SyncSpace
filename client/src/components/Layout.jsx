import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('syncspace_sidebar_collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const location = useLocation();
  const hoverTimer = useRef(null);
  const sidebarRef = useRef(null);

  const isGroupPage = location.pathname.startsWith('/groups/');

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('syncspace_sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Handle Resize and persist custom width
  useEffect(() => {
    const root = document.documentElement;
    const savedWidth = localStorage.getItem('syncspace_sidebar_width');
    if (savedWidth) {
      root.style.setProperty('--sidebar-width', savedWidth);
    }

    // Wait a brief moment for the sidebar DOM node to be available
    const timeoutId = setTimeout(() => {
      const sidebarEl = document.querySelector('.sidebar');
      if (!sidebarEl) return;
      
      // Watch for the user dragging the CSS resize handle on the sidebar
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          // Only save width if we are NOT collapsed or hover-expanded
          if (!sidebarEl.classList.contains('collapsed') && !sidebarEl.classList.contains('hover-expanded')) {
            const newWidth = entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width;
            if (newWidth > 150 && newWidth < 500) {
              const widthStr = `${newWidth}px`;
              root.style.setProperty('--sidebar-width', widthStr);
              localStorage.setItem('syncspace_sidebar_width', widthStr);
            }
          }
        }
      });

      observer.observe(sidebarEl);
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-collapse sidebar when navigating to a group page (if not already collapsed)
  useEffect(() => {
    if (isGroupPage) {
      setCollapsed(true);
      setHoverExpanded(false);
    }
  }, [isGroupPage]);

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
