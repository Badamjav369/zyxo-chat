import { State } from './state.js';
import { ZyxoCrypto } from '../crypto.js';
import { appendMessage, scrollToBottom } from './messages.js';
import { loadConversations } from './people.js';

export function connectSocket() {
  State.socket = io({
    auth: {
      token: State.token
    }
  });

  State.socket.on('connect', onConnect);
  State.socket.on('new_message', onNewMessage);
  State.socket.on('user_status', onUserStatus);
  State.socket.on('typing_start', onTypingStart);
  State.socket.on('typing_stop', onTypingStop);
}

function onConnect() {
  console.log('[Socket] Connected');
}

async function onNewMessage(message) {
  if (State.activeConversation?.id === message.conversation_id) {
    const plaintext = await ZyxoCrypto.decryptMessage(
      message.encrypted_message,
      message.iv,
      message.conversation_id,
      State.user.id,
      State.activePartner.id
    );

    appendMessage({
      ...message,
      plaintext
    });

    scrollToBottom();
  }

  loadConversations();
}

function onUserStatus({ userId, status }) {
  syncUserStatus(userId, status);
}

function onTypingStart({ sender_id, conversation_id }) {
  const isCurrentChat =
    State.activeConversation?.id === conversation_id &&
    sender_id === State.activePartner?.id;

  if (isCurrentChat) {
    setTypingVisible(true);
  }
}

function onTypingStop({ sender_id, conversation_id }) {
  const isCurrentChat =
    State.activeConversation?.id === conversation_id &&
    sender_id === State.activePartner?.id;

  if (isCurrentChat) {
    setTypingVisible(false);
  }
}

function syncUserStatus(userId, status) {
  const user = State.allUsers.find(user => user.id === userId);

  if (user) {
    user.status = status;
  }

  const isOnline = status === 'online';

  document
    .querySelectorAll(`[data-user-id="${userId}"] .online-dot`)
    .forEach(dot => {
      dot.classList.toggle('offline', !isOnline);
    });

  if (State.activePartner?.id === userId) {
    const statusElement = document.getElementById('chat-partner-status');
    const dotElement = document.getElementById('chat-partner-dot');

    statusElement.className = `chat-header-status${isOnline ? '' : ' offline'}`;

    statusElement.innerHTML = `
      <span class="dot"></span>
      <span>${isOnline ? 'Online' : 'Offline'}</span>
    `;

    dotElement.classList.toggle('offline', !isOnline);
  }
}

function setTypingVisible(visible) {
  const element = document.getElementById('typing-indicator');

  element.style.display = visible ? 'flex' : 'none';

  if (visible) {
    scrollToBottom();
  }
}

export function emitTypingStart(conversationId, receiverId) {
  State.socket?.emit('typing_start', {
    conversation_id: conversationId,
    receiver_id: receiverId
  });
}

export function emitTypingStop(conversationId, receiverId) {
  State.socket?.emit('typing_stop', {
    conversation_id: conversationId,
    receiver_id: receiverId
  });
}

export function emitSendMessage(payload) {
  State.socket?.emit('send_message', payload);
}

export function emitJoinConversation(conversationId) {
  State.socket?.emit('join_conversation', conversationId);
}