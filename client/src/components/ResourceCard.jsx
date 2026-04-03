import { useState } from 'react';
import { Link, FileText, Play, ExternalLink, ThumbsUp, ThumbsDown, Bookmark, Trash2, AlertTriangle, X } from 'lucide-react';
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

export default function ResourceCard({ resource, onVote, onDelete, canDelete, showGroup = false, style }) {
  const [bookmarked, setBookmarked] = useState(isBookmarked(resource._id));
  const [voteAnim, setVoteAnim] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleBookmark = () => {
    const result = toggleBookmark(resource._id);
    setBookmarked(result);
  };

  const handleVote = (type) => {
    setVoteAnim(type);
    setTimeout(() => setVoteAnim(null), 400);
    onVote?.(resource._id, type);
  };

  const handleDeleteClick = () => setConfirmDelete(true);
  const handleDeleteConfirm = () => { setConfirmDelete(false); onDelete?.(resource._id); };
  const handleDeleteCancel = () => setConfirmDelete(false);

  const typeIcon = () => {
    switch (resource.Resource_Type?.toLowerCase()) {
      case 'link': return <Link size={14} />;
      case 'video': return <Play size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const upvoteCount = resource.Upvotes?.length || 0;
  const downvoteCount = resource.Downvotes?.length || 0;

  return (
    <div className="resource-card glass" style={style}>
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
        </div>
        <h4 className="resource-name">{resource.Name || resource.Original_title || 'Untitled'}</h4>
        {resource.Description && (
          <p className="resource-description">{resource.Description}</p>
        )}
        {resource.Original_title && resource.Name && resource.Original_title !== resource.Name && (
          <p className="resource-og-title">{resource.Original_title}</p>
        )}
        {resource.Content && (
          <div className="resource-content">
            {(resource.Resource_Type?.toLowerCase() === 'link' || resource.Resource_Type?.toLowerCase() === 'video') ? (
              <a href={resource.Content} target="_blank" rel="noopener noreferrer" className="resource-link">
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
            <Avatar name={resource.Posted_By?.UserName} size={22} />
            <span>{resource.Posted_By?.UserName || 'Unknown'}</span>
          </div>
          <div className="resource-actions">
            {confirmDelete ? (
              <DeleteConfirmInline onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
            ) : (
              <>
                <button className={`vote-btn ${voteAnim === 'up' ? 'vote-pulse' : ''}`} onClick={() => handleVote('up')} title="Upvote">
                  <ThumbsUp size={14} />
                  <span>{upvoteCount}</span>
                </button>
                <button className={`vote-btn ${voteAnim === 'down' ? 'vote-pulse' : ''}`} onClick={() => handleVote('down')} title="Downvote">
                  <ThumbsDown size={14} />
                  <span>{downvoteCount}</span>
                </button>
                <button className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark} title="Bookmark">
                  <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
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
