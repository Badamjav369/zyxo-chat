const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const token = jwt.sign(
      {
        id: result.insertId,
        email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        status: 'online'
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['online', user.id]
    );

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: 'online'
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No token'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['offline', decoded.id]
    );

    res.json({
      message: 'Logged out successfully'
    });
  } catch {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;