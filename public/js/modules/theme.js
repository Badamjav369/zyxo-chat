const STORAGE_KEY = 'zyxo_theme';

export function setTheme(mode) {
  document.body.classList.toggle('light', mode === 'light');
  document.body.classList.toggle('dark', mode === 'dark');

  localStorage.setItem(STORAGE_KEY, mode);

  document
    .getElementById('radio-light')
    .classList.toggle('checked', mode === 'light');

  document
    .getElementById('radio-dark')
    .classList.toggle('checked', mode === 'dark');
}

export function initTheme() {
  const savedTheme =
    localStorage.getItem(STORAGE_KEY) || 'dark';

  setTheme(savedTheme);
}