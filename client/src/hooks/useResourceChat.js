import { useState, useEffect, useCallback } from 'react';
import useSocket from './useSocket';
import api from '../api/api';

export default function useResourceChat(resourceId) {
  const { socket, isConnected } = useSocket();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);

  // Initial load
  useEffect(() => {
    if (!resourceId) return;
    setLoading(true);
    api.getResourceComments(resourceId)
      .then(data => {
        setComments(data.comments || []);
      })
      .catch(err => console.error('Failed to load comments:', err))
      .finally(() => setLoading(false));
  }, [resourceId]);

  // Socket room management
  useEffect(() => {
    if (!socket || !isConnected || !resourceId) return;

    socket.emit('join_resource', resourceId);

    socket.on('new_comment', (comment) => {
      setComments(prev => {
        // Avoid duplicates
        if (prev.some(c => c._id === comment._id)) return prev;
        return [...prev, comment];
      });
    });

    socket.on('delete_comment', ({ commentId }) => {
      setComments(prev => prev.filter(c => c._id !== commentId));
    });

    socket.on('user_typing', ({ userName }) => {
      setTypingUser(userName);
    });

    socket.on('user_stop_typing', () => {
      setTypingUser(null);
    });

    return () => {
      socket.emit('leave_resource', resourceId);
      socket.off('new_comment');
      socket.off('delete_comment');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, isConnected, resourceId]);

  const sendComment = useCallback(async (content) => {
    if (!content.trim()) return;
    try {
      const data = await api.addComment(resourceId, content.trim());
      // The socket will broadcast so we don't need to manually add
      return data.comment;
    } catch (err) {
      console.error('Failed to send comment:', err);
      throw err;
    }
  }, [resourceId]);

  const deleteComment = useCallback(async (commentId) => {
    try {
      await api.deleteComment(commentId);
      // The socket will broadcast so we don't need to manually remove
    } catch (err) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  }, []);

  const emitTyping = useCallback((userName) => {
    if (socket && isConnected) {
      socket.emit('typing', { resourceId, userName });
    }
  }, [socket, isConnected, resourceId]);

  const emitStopTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('stop_typing', { resourceId });
    }
  }, [socket, isConnected, resourceId]);

  return {
    comments,
    loading,
    sendComment,
    deleteComment,
    typingUser,
    emitTyping,
    emitStopTyping,
    isConnected,
  };
}
