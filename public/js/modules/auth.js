import { State } from './state.js';
import { AuthAPI } from './api.js';

let onLoginSuccess = () => {};

export function setLaunchCallback(fn) {
  onLoginSuccess = fn;
}

export function switchTab(tab) {
  const isLogin = tab === 'login';

  document.getElementById('login-form').hidden = !isLogin;
  document.getElementById('register-form').hidden = isLogin;

  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
}

export async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');

  errorElement.textContent = '';

  if (!email || !password) {
    errorElement.textContent = 'Бүх талбарыг бөглөнө үү.';
    return;
  }

  try {
    const { token, user } = await AuthAPI.login(email, password);

    saveSession(token, user);
    onLoginSuccess();
  } catch (error) {
    errorElement.textContent = error.message;
  }
}

export async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorElement = document.getElementById('register-error');

  errorElement.textContent = '';

  if (!username || !email || !password) {
    errorElement.textContent = 'Бүх талбарыг бөглөнө үү.';
    return;
  }

  try {
    const { token, user } = await AuthAPI.register(username, email, password);

    saveSession(token, user);
    onLoginSuccess();
  } catch (error) {
    errorElement.textContent = error.message;
  }
}

export async function handleLogout() {
  try {
    await AuthAPI.logout();
  } catch {
    // ignored
  }

  State.socket?.disconnect();
  clearSession();

  document.getElementById('app').classList.remove('visible');
  document.getElementById('auth-screen').style.display = 'flex';
}

function saveSession(token, user) {
  State.token = token;
  State.user = user;

  localStorage.setItem('zyxo_token', token);
  localStorage.setItem('zyxo_user', JSON.stringify(user));
}

function clearSession() {
  State.token = null;
  State.user = null;

  localStorage.removeItem('zyxo_token');
  localStorage.removeItem('zyxo_user');
}