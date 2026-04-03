import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Read from localStorage on init — the blocking script in index.html
    // already set the correct data-theme before React loaded, so no flash.
    const saved = localStorage.getItem('syncspace_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  // Sync data-theme attribute on every theme change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('syncspace_theme', theme);
  }, [theme]);

  // Add theme-ready class AFTER the first paint so body transitions
  // are suppressed on initial load (eliminates FOUC completely)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.body.classList.add('theme-ready');
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
