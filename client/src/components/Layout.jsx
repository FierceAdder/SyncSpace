import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Auto-collapse sidebar when navigating to a group page
  useEffect(() => {
    if (location.pathname.startsWith('/groups/')) {
      setCollapsed(true);
    }
  }, [location.pathname]);

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

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header collapsed={collapsed} />
      <main className="main-content" style={{ marginLeft: collapsed ? '68px' : 'var(--sidebar-width)' }}>
        <Outlet />
      </main>
    </div>
  );
}
