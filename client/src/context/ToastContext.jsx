import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: 'fixed',
      top: 'calc(var(--header-height) + 16px)',
      right: '16px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const colors = {
    success: { bg: 'hsla(155, 75%, 48%, 0.12)', border: 'hsla(155, 75%, 48%, 0.3)', color: 'hsl(155, 75%, 48%)' },
    error:   { bg: 'hsla(0, 85%, 60%, 0.12)', border: 'hsla(0, 85%, 60%, 0.3)', color: 'hsl(0, 85%, 60%)' },
    info:    { bg: 'hsla(210, 100%, 55%, 0.12)', border: 'hsla(210, 100%, 55%, 0.3)', color: 'hsl(210, 100%, 55%)' },
    warning: { bg: 'hsla(38, 95%, 55%, 0.12)', border: 'hsla(38, 95%, 55%, 0.3)', color: 'hsl(38, 95%, 55%)' },
  };
  const c = colors[toast.type] || colors.info;

  return (
    <div
      onClick={onClose}
      style={{
        pointerEvents: 'auto',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: c.bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${c.border}`,
        color: c.color,
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        animation: 'slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {toast.message}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        background: c.color,
        animation: `shrinkBar ${toast.duration}ms linear forwards`,
      }} />
      <style>{`
        @keyframes shrinkBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
