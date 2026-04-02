// Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
};

// Toast notification
export const Toast = ({ message, type = 'info', onClose }) => {
  const colors = {
    info: 'bg-zinc-800 border-zinc-700 text-zinc-100',
    success: 'bg-zinc-900 border-emerald-800 text-emerald-400',
    error: 'bg-zinc-900 border-red-800 text-red-400',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-slide-up shadow-2xl ${colors[type]}`}>
      {type === 'success' && <span className="text-emerald-400">✓</span>}
      {type === 'error' && <span className="text-red-400">✕</span>}
      {type === 'info' && <span className="text-zinc-400">●</span>}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors">✕</button>
    </div>
  );
};

// Skeleton loader
export const Skeleton = ({ className = '' }) => (
  <div className={`shimmer rounded-lg ${className}`} />
);

// Modal
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 card w-full max-w-md mx-4 p-6 animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Error message
export const ErrorMsg = ({ message }) => (
  <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3 animate-fade-in">
    {message}
  </div>
);

// Empty state
export const EmptyState = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
    <div className="text-4xl mb-4 opacity-30">{icon}</div>
    <p className="text-zinc-400 font-medium mb-1">{title}</p>
    {subtitle && <p className="text-zinc-600 text-sm">{subtitle}</p>}
  </div>
);
