const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../db');

const router = express.Router();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'Invalid token'
    });
  }
}

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `
        SELECT id, username, email, status, created_at
        FROM users
        WHERE id = ?
      `,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(users[0]);
  } catch {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `
        SELECT id, username, email, status
        FROM users
        WHERE id != ?
        ORDER BY username ASC
      `,
      [req.user.id]
    );

    res.json(users);
  } catch {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = {
  router,
  authMiddleware
};