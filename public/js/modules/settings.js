export function toggleSession() {
  const toggle = document.getElementById('session-toggle');

  const enabled = toggle.classList.toggle('on');

  toggle.setAttribute('aria-checked', String(enabled));
}