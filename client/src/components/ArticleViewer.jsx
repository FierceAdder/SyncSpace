import { useEffect, useRef } from 'react';
import { X, ThumbsUp, ThumbsDown, Bookmark, Calendar, User } from 'lucide-react';
import Avatar from './Avatar';
import CommentThread from './CommentThread';
import './ArticleViewer.css';

export default function ArticleViewer({ resource, isOpen, onClose, onVote, onBookmark, bookmarked }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !resource) return null;

  const upvoteCount = resource.Upvotes?.length || 0;
  const downvoteCount = resource.Downvotes?.length || 0;
  const readTime = Math.max(1, Math.ceil(
    (resource.Article_Body || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&#?\w+;/g, ' ').split(/\s+/).filter(Boolean).length / 200
  ));

  const createdDate = resource.createdAt
    ? new Date(resource.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="article-viewer-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="article-viewer-container">
        <button className="article-viewer-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <article className="article-viewer-content">
          {/* Header */}
          <div className="article-viewer-header">
            {resource.Category && (
              <span className="badge badge-cyan">{resource.Category}</span>
            )}
            <h1 className="article-viewer-title">{resource.Name || 'Untitled Article'}</h1>
            {resource.Description && (
              <p className="article-viewer-subtitle">{resource.Description}</p>
            )}

            <div className="article-viewer-meta">
              <div className="article-viewer-author">
                <Avatar name={resource.Posted_By?.UserName} src={resource.Posted_By?.Avatar_Url} size={36} />
                <div>
                  <span className="article-viewer-author-name">{resource.Posted_By?.UserName || 'Unknown'}</span>
                  {createdDate && (
                    <span className="article-viewer-date">
                      <Calendar size={12} /> {createdDate} · {readTime} min read
                    </span>
                  )}
                </div>
              </div>

              <div className="article-viewer-actions">
                <button className="vote-btn-viewer" onClick={() => onVote?.(resource._id, 'up')} title="Upvote">
                  <ThumbsUp size={16} /> <span>{upvoteCount}</span>
                </button>
                <button className="vote-btn-viewer" onClick={() => onVote?.(resource._id, 'down')} title="Downvote">
                  <ThumbsDown size={16} /> <span>{downvoteCount}</span>
                </button>
                <button
                  className={`bookmark-btn-viewer ${bookmarked ? 'bookmarked' : ''}`}
                  onClick={() => onBookmark?.(resource._id)}
                  title="Bookmark"
                >
                  <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="article-viewer-divider" />

          {/* Body */}
          <div
            className="article-viewer-body ql-editor"
            dangerouslySetInnerHTML={{ __html: resource.Article_Body || '<p>No content.</p>' }}
          />

          {/* Divider */}
          <div className="article-viewer-divider" />

          {/* Comments */}
          <div className="article-viewer-comments">
            <h3>💬 Discussion</h3>
            <CommentThread resourceId={resource._id} />
          </div>
        </article>
      </div>
    </div>
  );
}
