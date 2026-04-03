import { Crown, Mail } from 'lucide-react';
import Avatar from './Avatar';
import './MemberCard.css';

export default function MemberCard({ member, isGroupOwner, onRemove, style }) {
  return (
    <div className="member-card glass" style={style}>
      <div className="member-info">
        <Avatar name={member.UserName} size={40} />
        <div className="member-details">
          <div className="member-name">
            {member.UserName}
            {member.isOwner && (
              <span className="owner-badge"><Crown size={12} /> Owner</span>
            )}
          </div>
          <div className="member-email">
            <Mail size={12} />
            {member.Email}
          </div>
        </div>
      </div>
      {isGroupOwner && !member.isOwner && (
        <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => onRemove?.(member._id)}>
          Remove
        </button>
      )}
    </div>
  );
}
