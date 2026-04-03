export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function getAvatarColor(name) {
  if (!name) return 'hsl(210, 90%, 40%)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  // Avoid yellows/light greens (50-90 hue range) which look washed out
  const adjustedHue = (hue >= 50 && hue <= 90) ? hue + 120 : hue;
  return `hsl(${adjustedHue}, 85%, 38%)`;
}

export function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

export function getResourceIcon(type) {
  switch (type?.toLowerCase()) {
    case 'link': return 'Link';
    case 'video': return 'Play';
    default: return 'FileText';
  }
}
