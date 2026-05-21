require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const db = require('./db');
const authRoutes = require('./routes/auth');
const { router: usersRouter } = require('./routes/users');
const conversationsRouter = require('./routes/conversations');
const messagesRouter = require('./routes/messages');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const onlineUsers = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/messages', messagesRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

io.use((socket, next) => {
  const { token } = socket.handshake.auth;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async socket => {
  const userId = socket.userId;

  onlineUsers.set(userId, socket.id);

  try {
    await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['online', userId]
    );
  } catch {
    // алгассан
  }

  io.emit('user_status', {
    userId,
    status: 'online'
  });

  console.log(`✅ User ${userId} connected [${socket.id}]`);

  socket.on('join_conversation', conversationId => {
    socket.join(`conv_${conversationId}`);
  });

  socket.on('send_message', async data => {
    const {
      conversation_id,
      receiver_id,
      encrypted_message,
      iv,
      auth_tag
    } = data;

    try {
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
          userId,
          receiver_id,
          encrypted_message,
          iv,
          auth_tag || null
        ]
      );

      const [rows] = await db.query(
        `
          SELECT m.*, u.username AS sender_username
          FROM messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.id = ?
        `,
        [result.insertId]
      );

      io.to(`conv_${conversation_id}`).emit('new_message', rows[0]);
    } catch (error) {
      console.error('Socket send_message error:', error);

      socket.emit('error', {
        message: 'Failed to send message'
      });
    }
  });

  socket.on('typing_start', ({ conversation_id, receiver_id }) => {
    const receiverSocketId = onlineUsers.get(receiver_id);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing_start', {
        sender_id: userId,
        conversation_id
      });
    }
  });

  socket.on('typing_stop', ({ conversation_id, receiver_id }) => {
    const receiverSocketId = onlineUsers.get(receiver_id);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing_stop', {
        sender_id: userId,
        conversation_id
      });
    }
  });

  socket.on('disconnect', async () => {
    onlineUsers.delete(userId);

    try {
      await db.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['offline', userId]
      );
    } catch {
      // ignored
    }

    io.emit('user_status', {
      userId,
      status: 'offline'
    });

    console.log(`❌ User ${userId} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 ZYXO-CHAT server running on http://localhost:${PORT}`);
});