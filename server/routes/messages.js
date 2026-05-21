const express = require('express');

const db = require('../db');
const { authMiddleware } = require('./users');

const router = express.Router();

router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const [conversations] = await db.query(
      `
        SELECT *
        FROM conversations
        WHERE id = ?
          AND (user_one_id = ? OR user_two_id = ?)
      `,
      [conversationId, userId, userId]
    );

    if (!conversations.length) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const [messages] = await db.query(
      `
        SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          m.receiver_id,
          m.encrypted_message,
          m.iv,
          m.auth_tag,
          m.created_at,
          u.username AS sender_username
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
      `,
      [conversationId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      conversation_id,
      receiver_id,
      encrypted_message,
      iv,
      auth_tag
    } = req.body;

    const senderId = req.user.id;

    if (!conversation_id || !receiver_id || !encrypted_message || !iv) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO messages (
          conversation_id,
          sender_id,
          receiver_id,
          encrypted_message,
          iv,
          auth_tag
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        conversation_id,
        senderId,
        receiver_id,
        encrypted_message,
        iv,
        auth_tag || null
      ]
    );

    const [messages] = await db.query(
      `
        SELECT m.*, u.username AS sender_username
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(messages[0]);
  } catch (error) {
    console.error('Send message error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;