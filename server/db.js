require('dotenv').config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zyxo_chat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    console.log('✅ MySQL database connected successfully');

    connection.release();
  } catch (error) {
    console.error(
      '❌ Database connection failed:',
      error.message
    );

    process.exit(1);
  }
}

testConnection();

module.exports = pool;