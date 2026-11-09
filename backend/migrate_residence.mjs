import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const sql = `
CREATE TABLE IF NOT EXISTS residence_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  language ENUM('th','en') DEFAULT 'en',
  full_name VARCHAR(255) NOT NULL,
  passport_no VARCHAR(100) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  application_date DATE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  signature VARCHAR(500) NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by VARCHAR(255),
  approved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

await db.execute(sql);
console.log('✅ residence_certificates table created/verified.');
await db.end();
