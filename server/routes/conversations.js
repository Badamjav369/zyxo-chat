const express = require('express');

const db = require('../db');
const { authMiddleware } = require('./users');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await db.query(
      `
        SELECT
          c.id,
          c.created_at,
          CASE
            WHEN c.user_one_id = ? THEN c.user_two_id
            ELSE c.user_one_id
          END AS partner_id,
          u.username AS partner_username,
          u.email AS partner_email,
          u.status AS partner_status,
          m.encrypted_message AS last_message,
          m.iv AS last_iv,
          m.sender_id AS last_sender_id,
          m.created_at AS last_message_time
        FROM conversations c
        JOIN users u
          ON u.id = CASE
            WHEN c.user_one_id = ? THEN c.user_two_id
            ELSE c.user_one_id
          END
        LEFT JOIN messages m
          ON m.id = (
            SELECT id
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
          )
        WHERE c.user_one_id = ? OR c.user_two_id = ?
        ORDER BY COALESCE(m.created_at, c.created_at) DESC
      `,
      [userId, userId, userId, userId]
    );

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { partner_id } = req.body;
    const userId = req.user.id;

    if (!partner_id) {
      return res.status(400).json({
        error: 'partner_id required'
      });
    }

    const userOneId = Math.min(userId, partner_id);
    const userTwoId = Math.max(userId, partner_id);

    const [existingConversations] = await db.query(
      'SELECT * FROM conversations WHERE user_one_id = ? AND user_two_id = ?',
      [userOneId, userTwoId]
    );

    if (existingConversations.length) {
      return res.json(existingConversations[0]);
    }

    const [result] = await db.query(
      'INSERT INTO conversations (user_one_id, user_two_id) VALUES (?, ?)',
      [userOneId, userTwoId]
    );

    const [conversations] = await db.query(
      'SELECT * FROM conversations WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(conversations[0]);
  } catch (error) {
    console.error('Create conversation error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;