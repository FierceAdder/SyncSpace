import { getInitials, getAvatarColor } from '../utils/helpers';
import './Avatar.css';

export default function Avatar({ name, src, size = 36 }) {
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  if (src) {
    return (
      <div
        className="avatar avatar-img"
        style={{
          width: size,
          height: size,
        }}
      >
        <img
          src={src}
          alt={name || ''}
          onError={(e) => {
            // Fallback to initials on error
            e.target.style.display = 'none';
            e.target.parentElement.classList.add('avatar-fallback');
            e.target.parentElement.style.background = color;
            e.target.parentElement.style.fontSize = size * 0.38 + 'px';
          }}
        />
        {/* Fallback initials (hidden by default when img loads) */}
        <span className="avatar-initials-fallback" style={{ fontSize: size * 0.38 }}>{initials}</span>
      </div>
    );
  }

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
