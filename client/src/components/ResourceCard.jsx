import { useState } from 'react';
import { Link, FileText, Play, ExternalLink, ThumbsUp, ThumbsDown, Bookmark, Trash2, AlertTriangle, X, FileIcon, PenLine, Download, MessageCircle } from 'lucide-react';
import { isBookmarked, toggleBookmark } from '../utils/bookmarks';
import Avatar from './Avatar';
import './ResourceCard.css';

function DeleteConfirmInline({ onConfirm, onCancel }) {
  return (
    <div className="delete-confirm-inline">
      <AlertTriangle size={13} />
      <span>Delete this resource?</span>
      <button className="delete-confirm-yes" onClick={onConfirm}>Yes</button>
      <button className="delete-confirm-no" onClick={onCancel}><X size={12} /></button>
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ResourceCard({ resource, onVote, onDelete, canDelete, showGroup = false, style, onViewArticle, onViewChat, onDownload }) {
  const [bookmarked, setBookmarked] = useState(isBookmarked(resource._id));
  const [voteAnim, setVoteAnim] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleBookmark = (e) => {
    e.stopPropagation();
    const result = toggleBookmark(resource._id);
    setBookmarked(result);
  };

  const handleVote = (type, e) => {
    e?.stopPropagation();
    setVoteAnim(type);
    setTimeout(() => setVoteAnim(null), 400);
    onVote?.(resource._id, type);
  };

  const handleDeleteClick = (e) => { e.stopPropagation(); setConfirmDelete(true); };
  const handleDeleteConfirm = (e) => { e?.stopPropagation(); setConfirmDelete(false); onDelete?.(resource._id); };
  const handleDeleteCancel = (e) => { e?.stopPropagation(); setConfirmDelete(false); };

  const handleCardClick = () => {
    const type = resource.Resource_Type?.toLowerCase();
    if (type === 'article' && onViewArticle) {
      onViewArticle(resource);
    } else if ((type === 'link' || type === 'video') && resource.Content) {
      window.open(resource.Content, '_blank');
    }
  };

  const typeIcon = () => {
    switch (resource.Resource_Type?.toLowerCase()) {
      case 'link': return <Link size={14} />;
      case 'video': return <Play size={14} />;
      case 'article': return <PenLine size={14} />;
      case 'file': return <FileIcon size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const isArticle = resource.Resource_Type?.toLowerCase() === 'article';
  const isFile = resource.Resource_Type?.toLowerCase() === 'file';
  const upvoteCount = resource.Upvotes?.length || 0;
  const downvoteCount = resource.Downvotes?.length || 0;
  const readTime = isArticle ? Math.max(1, Math.ceil(
    (resource.Article_Body || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length / 200
  )) : null;

  return (
    <div
      className={`resource-card glass ${isArticle ? 'resource-card-clickable' : ''}`}
      style={style}
      onClick={handleCardClick}
    >
      {resource.Thumbnail_url && (
        <div className="resource-thumbnail">
          <img src={resource.Thumbnail_url} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      )}
      <div className="resource-body">
        <div className="resource-meta">
          <span className="badge">{typeIcon()} {resource.Resource_Type}</span>
          {resource.Category && <span className="badge badge-cyan">{resource.Category}</span>}
          {showGroup && resource.Group_Posted_In?.Group_Name && (
            <span className="resource-group-name">{resource.Group_Posted_In.Group_Name}</span>
          )}
          {isFile && resource.File_Size && (
            <span className="badge" style={{ opacity: 0.7 }}>{formatFileSize(resource.File_Size)}</span>
          )}
        </div>
        <h4 className="resource-name">{resource.Name || resource.Original_title || 'Untitled'}</h4>
        {resource.Description && (
          <p className="resource-description">{resource.Description}</p>
        )}
        {resource.Original_title && resource.Name && resource.Original_title !== resource.Name && (
          <p className="resource-og-title">{resource.Original_title}</p>
        )}

        {/* Article preview snippet */}
        {isArticle && resource.Article_Body && (
          <p className="resource-article-snippet">
            {resource.Article_Body.replace(/<[^>]*>/g, '').slice(0, 120)}...
            <span className="resource-read-cta">Read · {readTime} min</span>
          </p>
        )}

        {/* File download */}
        {isFile && (
          <button className="resource-download-btn" onClick={(e) => { e.stopPropagation(); onDownload?.(resource._id); }}>
            <Download size={13} /> Download {resource.File_Name || 'file'}
          </button>
        )}

        {resource.Content && !isArticle && !isFile && (
          <div className="resource-content">
            {(resource.Resource_Type?.toLowerCase() === 'link' || resource.Resource_Type?.toLowerCase() === 'video') ? (
              <a href={resource.Content} target="_blank" rel="noopener noreferrer" className="resource-link" onClick={e => e.stopPropagation()}>
                <ExternalLink size={12} />
                Open {resource.Resource_Type?.toLowerCase() === 'video' ? 'video' : 'link'}
              </a>
            ) : (
              <p className="resource-text">{resource.Content}</p>
            )}
          </div>
        )}
        <div className="resource-footer">
          <div className="resource-poster">
            <Avatar name={resource.Posted_By?.UserName} src={resource.Posted_By?.Avatar_Url} size={22} />
            <span>{resource.Posted_By?.UserName || 'Unknown'}</span>
          </div>
          <div className="resource-actions">
            {confirmDelete ? (
              <DeleteConfirmInline onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
            ) : (
              <>
                <button className={`vote-btn ${voteAnim === 'up' ? 'vote-pulse' : ''}`} onClick={(e) => handleVote('up', e)} title="Upvote">
                  <ThumbsUp size={14} />
                  <span>{upvoteCount}</span>
                </button>
                <button className={`vote-btn ${voteAnim === 'down' ? 'vote-pulse' : ''}`} onClick={(e) => handleVote('down', e)} title="Downvote">
                  <ThumbsDown size={14} />
                  <span>{downvoteCount}</span>
                </button>
                <button className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark} title="Bookmark">
                  <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
                {onViewChat && (
                  <button className="chat-btn" onClick={(e) => { e.stopPropagation(); onViewChat(resource); }} title="Chat">
                    <MessageCircle size={14} />
                  </button>
                )}
                {canDelete && (
                  <button className="delete-btn" onClick={handleDeleteClick} title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
