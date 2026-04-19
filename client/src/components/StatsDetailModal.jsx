import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Crown, Users, ChevronRight, X } from 'lucide-react';
import api from '../api/api';
import Avatar from './Avatar';
import './StatsDetailModal.css';

export default function StatsDetailModal({ isOpen, onClose, statType }) {
  const [groupsJoined, setGroupsJoined] = useState([]);
  const [groupsOwned, setGroupsOwned] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getGroupsDetail()
      .then(data => {
        setGroupsJoined(data.groups_joined || []);
        setGroupsOwned(data.groups_owned || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const isOwned = statType === 'owned';
  const groups = isOwned ? groupsOwned : groupsJoined;
  const title = isOwned ? 'Groups You Own' : 'Groups You\'re In';
  const icon = isOwned ? <Crown size={18} /> : <Users size={18} />;

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal glass" onClick={e => e.stopPropagation()}>
        <div className="stats-modal-header">
          <div className="stats-modal-title">
            {icon}
            <h3>{title}</h3>
          </div>
          <button className="stats-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="stats-modal-body">
          {loading ? (
            <div className="stats-modal-loading"><div className="spinner" /></div>
          ) : groups.length === 0 ? (
            <div className="stats-modal-empty">
              <FolderOpen size={32} strokeWidth={1.2} />
              <p>No groups yet</p>
            </div>
          ) : (
            <div className="stats-modal-list">
              {groups.map((g, i) => (
                <button
                  key={g._id}
                  className="stats-modal-item"
                  onClick={() => { navigate(`/groups/${g._id}`); onClose(); }}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <Avatar name={g.name} size={32} />
                  <span className="stats-modal-item-name">{g.name}</span>
                  <ChevronRight size={14} className="stats-modal-chevron" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
