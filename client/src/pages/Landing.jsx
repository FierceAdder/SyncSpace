import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, Share2, Search, Users, Zap, Shield, Globe, Sun, Moon, PenLine, FileUp, MessageCircle, Link, FileText, ThumbsUp, BookOpen, Bookmark } from 'lucide-react';
import api from '../api/api';
import './Landing.css';

// Animated counter for hero stats
function HeroCounter({ end, suffix = '', duration = 2000 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setValue(0);
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}

// Typewriter effect
function Typewriter({ text, speed = 35, delay = 800 }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [displayed, text, speed, started]);

  return (
    <span>
      {displayed}
      <span className="typewriter-cursor" />
    </span>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const sectionsRef = useRef([]);
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [liveStats, setLiveStats] = useState({ resources: 0, groups: 0, users: 0 });

  // Fetch real stats from backend
  useEffect(() => {
    api.getPublicStats().then(data => setLiveStats(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isAuthenticated, navigate]);

  // Scroll-reveal observer — toggles visible on/off so animations re-trigger
  useEffect(() => {
    const observers = [];
    sectionsRef.current.forEach((el) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.classList.add('visible');
            } else {
              el.classList.remove('visible');
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // Mouse-follow glow on hero
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    const hero = heroRef.current;
    if (hero) hero.addEventListener('mousemove', handleMouseMove);
    return () => { if (hero) hero.removeEventListener('mousemove', handleMouseMove); };
  }, []);

  const addRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="landing-logo-icon">S</div>
            <span className="landing-logo-text">SyncSpace</span>
          </div>
          <div className="landing-nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} style={{ color: 'var(--color-text-secondary)' }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-ghost" onClick={() => navigate('/login')}>Log In</button>
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
          <div className="hero-grid" />
          {/* Floating contextual icons */}
          <div className="hero-floating-icons">
            {[
              { Icon: Link, x: 6, y: 12, delay: 0, dur: 10, anim: 'fly-orbit-1' },
              { Icon: FileText, x: 88, y: 18, delay: 1.5, dur: 12, anim: 'fly-orbit-2' },
              { Icon: Users, x: 10, y: 72, delay: 3, dur: 9, anim: 'fly-drift-1' },
              { Icon: ThumbsUp, x: 82, y: 78, delay: 0.8, dur: 11, anim: 'fly-orbit-3' },
              { Icon: Search, x: 45, y: 6, delay: 2.2, dur: 13, anim: 'fly-drift-2' },
              { Icon: BookOpen, x: 94, y: 48, delay: 4, dur: 10, anim: 'fly-orbit-1' },
              { Icon: Bookmark, x: 3, y: 42, delay: 1, dur: 14, anim: 'fly-orbit-2' },
              { Icon: MessageCircle, x: 72, y: 8, delay: 5, dur: 11, anim: 'fly-drift-1' },
              { Icon: PenLine, x: 28, y: 88, delay: 2, dur: 12, anim: 'fly-orbit-3' },
              { Icon: Share2, x: 62, y: 90, delay: 3.5, dur: 9, anim: 'fly-drift-2' },
            ].map(({ Icon, x, y, delay, dur, anim }, i) => (
              <div
                key={i}
                className={`floating-icon ${anim}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${dur}s`,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
            ))}
          </div>
          {/* Mouse-follow glow */}
          <div
            className="hero-mouse-glow"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
            }}
          />
        </div>
        <div className="hero-content" ref={addRef}>
          <div className="hero-badge">
            <Zap size={14} />
            The smarter way to share knowledge
          </div>
          <h1 className="hero-title">
            Share. Discover.<br />
            <span className="hero-title-gradient">Learn Together.</span>
          </h1>
          <p className="hero-subtitle">
            <Typewriter
              text="SyncSpace is where study groups come alive. Share resources, curate knowledge, and build a collective brain — all in one beautiful, collaborative space."
              speed={20}
              delay={600}
            />
          </p>
          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={() => navigate('/register')}>
              Start for Free <ArrowRight size={18} />
            </button>
            <button className="btn-secondary btn-large" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">
                <HeroCounter end={liveStats.resources} suffix="+" />
              </span>
              <span className="hero-stat-label">Resources Shared</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">
                <HeroCounter end={liveStats.groups} suffix="+" />
              </span>
              <span className="hero-stat-label">Groups Created</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">
                <HeroCounter end={liveStats.users} />
              </span>
              <span className="hero-stat-label">Users Joined</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Share */}
      <section className="feature-section" ref={addRef}>
        <div className="feature-inner">
          <div className="feature-text scroll-reveal-left">
            <span className="feature-label">Share</span>
            <h2 className="feature-title">Drop links, videos, and notes <span className="text-gradient">effortlessly</span></h2>
            <p className="feature-desc">
              Paste a link and watch it transform — thumbnails, titles, and previews are auto-generated. Share YouTube videos, articles, PDFs, or quick notes with your group in seconds.
            </p>
          </div>
          <div className="feature-visual scroll-reveal-right">
            <div className="mock-card glass">
              <div className="mock-card-thumb" />
              <div className="mock-card-body">
                <div className="mock-badge-row">
                  <span className="badge">🔗 Link</span>
                  <span className="badge badge-cyan">CS101</span>
                </div>
                <div className="mock-title-bar" />
                <div className="mock-url-bar" />
                <div className="mock-footer">
                  <div className="mock-avatar" />
                  <div className="mock-votes">
                    <span>▲ 12</span>
                    <span>▼ 2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Discover */}
      <section className="feature-section feature-reverse" ref={addRef}>
        <div className="feature-inner">
          <div className="feature-text scroll-reveal-right">
            <span className="feature-label">Discover</span>
            <h2 className="feature-title">Search across all your groups <span className="text-gradient">instantly</span></h2>
            <p className="feature-desc">
              A powerful search that reaches across every group you're part of. Find that one article someone shared last month — by name, category, or content. Never lose a resource again.
            </p>
          </div>
          <div className="feature-visual scroll-reveal-left">
            <div className="mock-search glass">
              <div className="mock-search-bar">
                <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>Search resources…</span>
              </div>
              <div className="mock-search-results">
                {[1, 2, 3].map(i => (
                  <div key={i} className="mock-result">
                    <div className="mock-result-icon" />
                    <div className="mock-result-lines">
                      <div className="mock-line" style={{ width: `${80 - i * 15}%` }} />
                      <div className="mock-line short" style={{ width: `${50 - i * 8}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Learn Together */}
      <section className="feature-section" ref={addRef}>
        <div className="feature-inner">
          <div className="feature-text scroll-reveal-left">
            <span className="feature-label">Learn Together</span>
            <h2 className="feature-title">Groups that actually <span className="text-gradient">work</span></h2>
            <p className="feature-desc">
              Create invite-only study groups with a unique join code. Manage members, vote on the best resources, and keep everything organized by category. Collaboration made simple.
            </p>
          </div>
          <div className="feature-visual scroll-reveal-right">
            <div className="mock-group glass">
              <div className="mock-group-header">
                <div className="mock-group-avatar-set">
                  {['A', 'B', 'C', 'D'].map((l, i) => (
                    <div key={l} className="mock-member-avatar" style={{
                      background: `hsl(${210 + i * 40}, 70%, 55%)`,
                      zIndex: 4 - i,
                      marginLeft: i > 0 ? '-8px' : '0',
                    }}>{l}</div>
                  ))}
                  <span className="mock-member-count">+5 more</span>
                </div>
              </div>
              <div className="mock-group-code">
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>JOIN CODE</span>
                <span className="mock-code">Ab3xZ9</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-grid-section" ref={addRef}>
        <h2 className="section-heading">Everything you need, <span className="text-gradient">nothing you don't</span></h2>
        <div className="features-grid">
          {[
            { icon: Share2, title: 'Auto Previews', desc: 'OpenGraph scraping auto-generates thumbnails and titles for links' },
            { icon: Search, title: 'Global Search', desc: 'Find any resource across all your groups in milliseconds' },
            { icon: Users, title: 'Group Management', desc: 'Invite-only groups with join codes, member management, and roles' },
            { icon: PenLine, title: 'Article Authoring', desc: 'Write rich articles with a built-in editor — share knowledge as blog posts' },
            { icon: FileUp, title: 'File Uploads', desc: 'Upload PDFs, docs, and files directly with secure S3 storage' },
            { icon: MessageCircle, title: 'Resource Chat', desc: 'Real-time discussions on every resource — powered by WebSockets' },
            { icon: Shield, title: 'Secure by Default', desc: 'JWT authentication, bcrypt passwords, and authorization checks' },
            { icon: Zap, title: 'Voting System', desc: 'Upvote and downvote resources to surface the best content' },
            { icon: Globe, title: 'Open & Free', desc: 'No paywalls, no ads, no tracking. Just pure collaboration' },
          ].map((f, i) => (
            <div key={f.title} className="feature-grid-card glass" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="feature-grid-icon">
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" ref={addRef}>
        <div className="cta-glow" />
        <h2 className="cta-title">Ready to sync up?</h2>
        <p className="cta-desc">Join SyncSpace and start sharing resources with your group today.</p>
        <button className="btn-primary btn-large" onClick={() => navigate('/register')}>
          Get Started — It's Free <ArrowRight size={18} />
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-brand">
            <div className="landing-logo-icon">S</div>
            <span className="landing-logo-text">SyncSpace</span>
          </div>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} SyncSpace. Built with ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}
