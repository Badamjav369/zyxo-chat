const ZyxoCrypto = (() => {
  const keyStore = new Map();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function deriveKey(secret, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100_000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encrypt(plaintext, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    );

    return {
      encrypted: toBase64(encrypted),
      iv: toBase64(iv)
    };
  }

  async function decrypt(encryptedB64, ivB64, key) {
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(ivB64) },
        key,
        fromBase64(encryptedB64)
      );

      return decoder.decode(decrypted);
    } catch {
      return '[Encrypted message]';
    }
  }

  async function getOrCreateKey(conversationId, userId1, userId2) {
    if (keyStore.has(conversationId)) {
      return keyStore.get(conversationId);
    }

    const firstUserId = Math.min(userId1, userId2);
    const secondUserId = Math.max(userId1, userId2);

    const secret = `zyxo_${conversationId}_${firstUserId}_${secondUserId}`;
    const salt = `zyxo_salt_${conversationId}`;
    const key = await deriveKey(secret, salt);

    keyStore.set(conversationId, key);
    return key;
  }

  async function encryptMessage(plaintext, conversationId, userId1, userId2) {
    const key = await getOrCreateKey(conversationId, userId1, userId2);
    return encrypt(plaintext, key);
  }
  
  async function decryptMessage(encryptedB64, ivB64, conversationId, userId1, userId2) {
    const key = await getOrCreateKey(conversationId, userId1, userId2);
    return decrypt(encryptedB64, ivB64, key);
  }

  function generateSecret() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function toBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  function fromBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }

  return {
    generateSecret,
    encryptMessage,
    decryptMessage
  };
})();

window.ZyxoCrypto = ZyxoCrypto;

export { ZyxoCrypto };