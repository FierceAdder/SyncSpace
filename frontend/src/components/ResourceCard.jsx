import { useState } from 'react';
import { upvoteResource, downvoteResource, deleteResource } from '../utils/api';
import { Spinner } from './UI';
import { useAuth } from '../hooks/useAuth';

const TYPE_COLORS = {
  Link: 'bg-blue-950 text-blue-400 border-blue-900',
  Note: 'bg-amber-950 text-amber-400 border-amber-900',
  Video: 'bg-purple-950 text-purple-400 border-purple-900',
  File: 'bg-green-950 text-green-400 border-green-900',
  Other: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export const ResourceCard = ({ resource, onUpdate, onDelete, currentUserId }) => {
  const [voteLoading, setVoteLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isUpvoted = resource.Upvotes?.some(id => id === currentUserId || id?._id === currentUserId);
  const isDownvoted = resource.Downvotes?.some(id => id === currentUserId || id?._id === currentUserId);
  const isOwner = resource.Posted_By?._id === currentUserId || resource.Posted_By === currentUserId;
  const typeColor = TYPE_COLORS[resource.Resource_Type] || TYPE_COLORS.Other;

  const handleVote = async (type) => {
    if (voteLoading) return;
    setVoteLoading(type);
    try {
      const fn = type === 'up' ? upvoteResource : downvoteResource;
      await fn(resource._id);
      await onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setVoteLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this resource?')) return;
    setDeleteLoading(true);
    try {
      await deleteResource(resource._id);
      onDelete(resource._id);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isLink = resource.Resource_Type === 'Link' && resource.Content?.startsWith('http');

  return (
    <div className="card p-5 hover:border-zinc-700 transition-all duration-200 animate-fade-in group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-mono text-xs px-2 py-0.5 rounded-md border ${typeColor}`}>
            {resource.Resource_Type || 'Other'}
          </span>
          {resource.Category && (
            <span className="tag">{resource.Category}</span>
          )}
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all duration-150 text-xs flex items-center gap-1"
          >
            {deleteLoading ? <Spinner size="sm" /> : '⌫ delete'}
          </button>
        )}
      </div>

      <h3 className="font-semibold text-zinc-100 mb-2 leading-snug">{resource.Name}</h3>

      {resource.Content && (
        isLink ? (
          <a
            href={resource.Content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-zinc-300 font-mono truncate block mb-3 transition-colors"
          >
            {resource.Content}
          </a>
        ) : (
          <p className="text-sm text-zinc-400 leading-relaxed mb-3 line-clamp-3">{resource.Content}</p>
        )
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleVote('up')}
            disabled={!!voteLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150
              ${isUpvoted
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
          >
            {voteLoading === 'up' ? <Spinner size="sm" /> : '▲'}
            <span>{resource.Upvotes?.length || 0}</span>
          </button>
          <button
            onClick={() => handleVote('down')}
            disabled={!!voteLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150
              ${isDownvoted
                ? 'bg-red-950 text-red-400 border border-red-900'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
          >
            {voteLoading === 'down' ? <Spinner size="sm" /> : '▼'}
            <span>{resource.Downvotes?.length || 0}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-600">
          {resource.Group_Posted_In?.Group_Name && (
            <span className="tag">{resource.Group_Posted_In.Group_Name}</span>
          )}
          <span>by <span className="text-zinc-400 font-medium">{resource.Posted_By?.UserName || 'unknown'}</span></span>
        </div>
      </div>
    </div>
  );
};
