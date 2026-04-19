import { useState, useEffect } from 'react';
import { Lightbulb, Bug, Send, Check, ChevronDown, Clock } from 'lucide-react';
import Modal from './Modal';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import './FeedbackModal.css';

export default function FeedbackModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('feature_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myFeedback, setMyFeedback] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      api.getMyFeedback()
        .then(data => setMyFeedback(data.feedback || []))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await api.submitFeedback({
        Type: activeTab,
        Title: title.trim(),
        Description: description.trim()
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setDescription('');
        // Refresh history
        api.getMyFeedback().then(data => setMyFeedback(data.feedback || [])).catch(() => {});
      }, 2000);
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSubmitted(false);
    setShowHistory(false);
    onClose();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Feedback" size="md">
      {submitted ? (
        <div className="feedback-success">
          <div className="feedback-success-icon">
            <Check size={32} />
          </div>
          <h3>Thank you!</h3>
          <p>Your {activeTab === 'feature_request' ? 'feature request' : 'bug report'} has been submitted.</p>
        </div>
      ) : (
        <>
          <div className="feedback-tabs">
            <button
              type="button"
              className={`feedback-tab ${activeTab === 'feature_request' ? 'active feature' : ''}`}
              onClick={() => setActiveTab('feature_request')}
            >
              <Lightbulb size={16} />
              Request Feature
            </button>
            <button
              type="button"
              className={`feedback-tab ${activeTab === 'bug_report' ? 'active bug' : ''}`}
              onClick={() => setActiveTab('bug_report')}
            >
              <Bug size={16} />
              Report Bug
            </button>
          </div>

          <form onSubmit={handleSubmit} className="feedback-form">
            <div>
              <label className="feedback-label">Title</label>
              <input
                className="input-field"
                placeholder={activeTab === 'feature_request' ? 'What feature would you like?' : 'What went wrong?'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="feedback-label">Description</label>
              <textarea
                className="input-field"
                placeholder={activeTab === 'feature_request' ? 'Describe the feature in detail...' : 'Steps to reproduce the issue...'}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                style={{ resize: 'vertical' }}
                required
              />
            </div>
            <button className="btn-primary" disabled={loading || !title.trim() || !description.trim()} style={{ width: '100%' }}>
              {loading ? <span className="spinner" /> : <><Send size={16} /> Submit</>}
            </button>
          </form>

          {/* Feedback History */}
          {myFeedback.length > 0 && (
            <div className="feedback-history">
              <button
                className="feedback-history-toggle"
                onClick={() => setShowHistory(s => !s)}
              >
                <span>Your submissions ({myFeedback.length})</span>
                <ChevronDown size={16} className={showHistory ? 'rotated' : ''} />
              </button>
              {showHistory && (
                <div className="feedback-history-list">
                  {myFeedback.map((f, i) => (
                    <div key={f._id} className="feedback-history-item" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="feedback-history-item-header">
                        {f.Type === 'feature_request' ? <Lightbulb size={14} /> : <Bug size={14} />}
                        <span className="feedback-history-title">{f.Title}</span>
                        <span className={`feedback-status-badge ${f.Status}`}>{f.Status.replace('_', ' ')}</span>
                      </div>
                      <p className="feedback-history-desc">{f.Description}</p>
                      <span className="feedback-history-date"><Clock size={11} /> {formatDate(f.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
