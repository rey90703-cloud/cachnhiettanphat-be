// Database Configuration
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Tạo connection pool
// Sử dụng host/port cho production, socketPath cho local development
const poolConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cachnhiet_binhminh',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Kiểm tra môi trường để sử dụng socketPath hoặc host/port
if (process.env.NODE_ENV === 'production') {
  // Production: sử dụng host và port
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.DB_PORT || '3306');
} else {
  // Development: sử dụng socketPath cho XAMPP (macOS)
  poolConfig.socketPath = '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';
}

const pool = mysql.createPool(poolConfig);

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

export default pool;

