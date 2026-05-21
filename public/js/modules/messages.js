import { State } from './state.js';
import { MessagesAPI } from './api.js';
import { ZyxoCrypto } from '../crypto.js';
import { formatTime, formatDay, escHtml } from './utils.js';
import {
  emitSendMessage,
  emitTypingStart,
  emitTypingStop
} from './socket.js';

export async function loadMessages(conversationId) {
  const container = document.getElementById('messages-container');

  container.innerHTML = '';

  const messages = await MessagesAPI.getByConversation(conversationId);
  let lastDate = null;

  for (const message of messages) {
    const messageDate = new Date(message.created_at).toDateString();

    if (messageDate !== lastDate) {
      lastDate = messageDate;
      container.appendChild(createDateDivider(formatDay(message.created_at)));
    }

    const plaintext = await ZyxoCrypto.decryptMessage(
      message.encrypted_message,
      message.iv,
      conversationId,
      State.user.id,
      State.activePartner.id
    );

    appendMessage({
      ...message,
      plaintext
    });
  }

  scrollToBottom();
}

export function appendMessage(message) {
  const container = document.getElementById('messages-container');
  const isOutgoing = message.sender_id === State.user.id;

  const item = document.createElement('li');
  item.className = `message-wrap ${isOutgoing ? 'out' : 'in'}`;

  const ticks = isOutgoing
    ? '<span class="ticks" aria-hidden="true">✓✓</span>'
    : '';

  item.innerHTML = `
    <p class="message-bubble">${escHtml(message.plaintext || '[Encrypted message]')}</p>
    <footer class="message-meta">
      <time datetime="${message.created_at}">${formatTime(message.created_at)}</time>
      ${ticks}
    </footer>
  `;

  container.appendChild(item);
}

export function scrollToBottom() {
  const container = document.getElementById('messages-container');
  container.scrollTop = container.scrollHeight;
}

export async function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();

  if (!text || !State.activeConversation) {
    return;
  }

  input.value = '';
  resizeTextarea(input);

  const { encrypted, iv } = await ZyxoCrypto.encryptMessage(
    text,
    State.activeConversation.id,
    State.user.id,
    State.activePartner.id
  );

  emitSendMessage({
    conversation_id: State.activeConversation.id,
    receiver_id: State.activePartner.id,
    encrypted_message: encrypted,
    iv
  });
}

export function handleInputKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
    return;
  }

  resizeTextarea(event.target);
}

export function handleTyping() {
  const input = document.getElementById('message-input');

  resizeTextarea(input);

  if (!State.activeConversation || !State.activePartner) {
    return;
  }

  emitTypingStart(State.activeConversation.id, State.activePartner.id);

  clearTimeout(State.typingTimeout);

  State.typingTimeout = setTimeout(() => {
    emitTypingStop(State.activeConversation.id, State.activePartner.id);
  }, 2000);
}

function createDateDivider(label) {
  const element = document.createElement('li');

  element.className = 'date-divider';
  element.textContent = label;
  element.setAttribute('role', 'separator');

  return element;
}

function resizeTextarea(element) {
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
}