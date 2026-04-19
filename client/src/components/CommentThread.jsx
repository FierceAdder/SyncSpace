import { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useResourceChat from '../hooks/useResourceChat';
import Avatar from './Avatar';
import './CommentThread.css';

export default function CommentThread({ resourceId }) {
  const { user } = useAuth();
  const {
    comments,
    loading,
    sendComment,
    deleteComment,
    typingUser,
    emitTyping,
    emitStopTyping,
    isConnected,
  } = useResourceChat(resourceId);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendComment(input);
      setInput('');
      emitStopTyping();
    } catch {
      // error handled in hook
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (val) => {
    setInput(val);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    emitTyping(user?.Username);
    typingTimerRef.current = setTimeout(() => emitStopTyping(), 1500);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="comment-thread">
      <div className={`comment-thread-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot" />
        {isConnected ? 'Live' : 'Connecting...'}
      </div>

      <div className="comment-list" ref={listRef}>
        {loading ? (
          <div className="comment-loading">
            <div className="spinner" />
          </div>
        ) : comments.length === 0 ? (
          <div className="comment-empty">
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments.map((c, i) => (
            <div
              key={c._id}
              className="comment-item"
              style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
            >
              <Avatar name={c.Author?.UserName} src={c.Author?.Avatar_Url} size={28} />
              <div className="comment-item-body">
                <div className="comment-item-header">
                  <span className="comment-author">{c.Author?.UserName || 'Unknown'}</span>
                  <span className="comment-time">{formatTime(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.Content}</p>
              </div>
              {user?.Username === c.Author?.UserName && (
                <button className="comment-delete" onClick={() => deleteComment(c._id)} title="Delete">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))
        )}
        {typingUser && (
          <div className="comment-typing">
            <span className="typing-dots"><span /><span /><span /></span>
            {typingUser} is typing...
          </div>
        )}
      </div>

      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder="Write a comment..."
          value={input}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
        />
        <button
          className="comment-send"
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
