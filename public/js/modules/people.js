import { State } from './state.js';
import { UsersAPI, ConversationsAPI } from './api.js';
import { getInitials, formatDay, escHtml } from './utils.js';
import { loadMessages } from './messages.js';
import { emitJoinConversation } from './socket.js';

export async function loadUsers() {
  State.allUsers = await UsersAPI.getAll();
}

export async function loadConversations() {
  State.conversations = await ConversationsAPI.getAll();

  renderPeopleList(State.conversations);
}

export function renderPeopleList(conversations) {
  const list = document.getElementById('people-list');

  list.innerHTML = '';

  if (!conversations.length) {
    const empty = document.createElement('li');

    empty.className = 'people-empty';
    empty.innerHTML =
      'Чат байхгүй байна.<br/>More People товч дээр дарж чат эхлүүлээрэй.';

    list.appendChild(empty);

    return;
  }

  conversations.forEach(conversation => {
    list.appendChild(createPersonItem(conversation));
  });
}

export function filterPeople(query) {
  const value = query.toLowerCase();

  const filtered = State.conversations.filter(conversation =>
    conversation.partner_username
      .toLowerCase()
      .includes(value)
  );

  renderPeopleList(filtered);
}

export async function openConversation(conversation) {
  State.activeConversation = conversation;

  State.activePartner = {
    id: conversation.partner_id,
    username: conversation.partner_username,
    email: conversation.partner_email,
    status: conversation.partner_status
  };

  setActiveItem(conversation.id);
  showChatUI();
  updateChatHeader(conversation);

  emitJoinConversation(conversation.id);

  await loadMessages(conversation.id);
}

export function openPeopleModal() {
  renderModalPeople(State.allUsers);

  document
    .getElementById('people-modal-overlay')
    .classList.add('visible');
}

export function closePeopleModalBtn() {
  document
    .getElementById('people-modal-overlay')
    .classList.remove('visible');
}

export function closePeopleModal(event) {
  if (event.target.id !== 'people-modal-overlay') {
    return;
  }

  closePeopleModalBtn();
}

export function renderModalPeople(users) {
  const list = document.getElementById('modal-people-list');

  list.innerHTML = '';

  if (!users.length) {
    const empty = document.createElement('li');

    empty.className = 'people-empty';
    empty.textContent = 'Хэрэглэгч олдсонгүй.';

    list.appendChild(empty);

    return;
  }

  users.forEach(user => {
    list.appendChild(createModalPersonItem(user));
  });
}

export function filterModalPeople(query) {
  const value = query.toLowerCase();

  const filtered = State.allUsers.filter(user =>
    user.username.toLowerCase().includes(value) ||
    user.email.toLowerCase().includes(value)
  );

  renderModalPeople(filtered);
}

export async function startConversationWith(user) {
  const conversation = await ConversationsAPI.create(user.id);

  await loadConversations();

  closePeopleModalBtn();

  const fullConversation =
    State.conversations.find(item => item.id === conversation.id) || {
      ...conversation,
      partner_id: user.id,
      partner_username: user.username,
      partner_email: user.email,
      partner_status: user.status
    };

  openConversation(fullConversation);
}

function createPersonItem(conversation) {
  const isOnline = conversation.partner_status === 'online';

  const isActive =
    State.activeConversation?.id === conversation.id;

  const item = document.createElement('li');

  item.className = `person-item${isActive ? ' active' : ''}`;

  item.setAttribute(
    'data-user-id',
    conversation.partner_id
  );

  item.setAttribute(
    'data-conv-id',
    conversation.id
  );

  item.innerHTML = `
    <figure class="person-avatar">
      <span class="avatar">
        ${getInitials(conversation.partner_username)}
      </span>

      <span
        class="online-dot${isOnline ? '' : ' offline'}"
        aria-hidden="true"
      ></span>
    </figure>

    <div class="person-info">
      <strong class="person-name">
        ${escHtml(conversation.partner_username)}
      </strong>

      <p class="person-last-msg">
        ${conversation.last_message
          ? '🔒 Encrypted'
          : 'No messages yet'}
      </p>
    </div>

    <time class="person-time">
      ${conversation.last_message_time
        ? formatDay(conversation.last_message_time)
        : ''}
    </time>
  `;

  item.addEventListener('click', () => {
    openConversation(conversation);
  });

  return item;
}

function createModalPersonItem(user) {
  const isOnline = user.status === 'online';

  const item = document.createElement('li');

  item.className = 'modal-person-item';

  item.innerHTML = `
    <figure class="person-avatar">
      <span class="avatar">
        ${getInitials(user.username)}
      </span>

      <span
        class="online-dot${isOnline ? '' : ' offline'}"
        aria-hidden="true"
      ></span>
    </figure>

    <div class="person-info">
      <strong class="person-name">
        ${escHtml(user.username)}
      </strong>

      <p class="person-last-msg">
        ${escHtml(user.email)}
      </p>
    </div>

    <span class="person-status-badge ${isOnline ? 'online' : 'offline'}">
      ${isOnline ? 'Online' : 'Offline'}
    </span>
  `;

  item.addEventListener('click', () => {
    startConversationWith(user);
  });

  return item;
}

function setActiveItem(conversationId) {
  document
    .querySelectorAll('.person-item')
    .forEach(element => {
      element.classList.toggle(
        'active',
        element.dataset.convId === String(conversationId)
      );
    });
}

function showChatUI() {
  document.getElementById('chat-empty').style.display = 'none';
  document.getElementById('chat-header').style.display = 'flex';
  document.getElementById('messages-container').style.display = 'flex';
  document.getElementById('message-input-area').style.display = 'flex';
  document.getElementById('typing-indicator').style.display = 'none';
}

function updateChatHeader(conversation) {
  const isOnline = conversation.partner_status === 'online';

  document.getElementById('chat-partner-avatar').textContent =
    getInitials(conversation.partner_username);

  document.getElementById('chat-partner-name').textContent =
    conversation.partner_username;

  const statusElement = document.getElementById(
    'chat-partner-status'
  );

  const dotElement = document.getElementById(
    'chat-partner-dot'
  );

  statusElement.className =
    `chat-header-status${isOnline ? '' : ' offline'}`;

  statusElement.innerHTML = `
    <span class="dot"></span>
    <span>${isOnline ? 'Online' : 'Offline'}</span>
  `;

  dotElement.classList.toggle('offline', !isOnline);
}