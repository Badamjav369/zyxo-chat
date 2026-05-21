import { State } from './state.js';

const BASE_URL = '/api';

export async function apiFetch(path, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (State.token) {
    headers.Authorization = `Bearer ${State.token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const AuthAPI = {
  login: (email, password) =>
    apiFetch('/auth/login', 'POST', { email, password }),

  register: (username, email, password) =>
    apiFetch('/auth/register', 'POST', {
      username,
      email,
      password
    }),

  logout: () =>
    apiFetch('/auth/logout', 'POST')
};

export const UsersAPI = {
  me: () =>
    apiFetch('/users/me'),

  getAll: () =>
    apiFetch('/users')
};

export const ConversationsAPI = {
  getAll: () =>
    apiFetch('/conversations'),

  create: partnerId =>
    apiFetch('/conversations', 'POST', {
      partner_id: partnerId
    })
};

export const MessagesAPI = {
  getByConversation: id =>
    apiFetch(`/messages/${id}`)
};