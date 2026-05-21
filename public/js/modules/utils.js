export function formatTime(dateString) {
  if (!dateString) {
    return '';
  }

  return new Date(dateString).toLocaleTimeString('mn-MN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDay(dateString) {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);

  const diffDays = Math.floor(
    (Date.now() - date) / 86_400_000
  );

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (diffDays < 7) {
    return days[date.getDay()];
  }

  return date.toLocaleDateString();
}

export function getInitials(name) {
  if (!name) {
    return '??';
  }

  const parts = name.trim().split(' ');

  if (parts.length >= 2) {
    return (
      parts[0][0] + parts[1][0]
    ).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function escHtml(value) {
  const element = document.createElement('span');

  element.appendChild(
    document.createTextNode(value ?? '')
  );

  return element.innerHTML;
}