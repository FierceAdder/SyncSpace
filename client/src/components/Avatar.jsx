import { getInitials, getAvatarColor } from '../utils/helpers';
import './Avatar.css';

export default function Avatar({ name, size = 36 }) {
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: color,
      }}
    >
      {initials}
    </div>
  );
}
