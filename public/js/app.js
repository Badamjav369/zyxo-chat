import { State } from './modules/state.js';
import { initTheme, setTheme } from './modules/theme.js';
import { connectSocket } from './modules/socket.js';

import {
  loadUsers,
  loadConversations,
  openPeopleModal,
  closePeopleModalBtn,
  closePeopleModal,
  filterPeople,
  filterModalPeople
} from './modules/people.js';

import {
  sendMessage,
  handleInputKey,
  handleTyping
} from './modules/messages.js';

import {
  openE2EEModal,
  closeE2EEModalBtn,
  closeE2EEModal
} from './modules/modals.js';

import {
  switchTab,
  handleLogin,
  handleRegister,
  handleLogout,
  setLaunchCallback
} from './modules/auth.js';

import { toggleSession } from './modules/settings.js';

async function launchApp() {
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');

  authScreen.style.display = 'none';
  app.classList.add('visible');

  const { username, email } = State.user;

  document.getElementById('profile-name').textContent = username;
  document.getElementById('profile-email').textContent = email;
  document.getElementById('profile-avatar').textContent =
    username.slice(0, 2).toUpperCase();

  await loadUsers();
  await loadConversations();

  connectSocket();
}

setLaunchCallback(launchApp);
initTheme();

if (State.token && State.user) {
  launchApp();
}

Object.assign(window, {
  switchTab,
  handleLogin,
  handleRegister,
  handleLogout,
  setTheme,
  toggleSession,
  openPeopleModal,
  closePeopleModalBtn,
  closePeopleModal,
  filterPeople,
  filterModalPeople,
  sendMessage,
  handleInputKey,
  handleTyping,
  openE2EEModal,
  closeE2EEModalBtn,
  closeE2EEModal
});