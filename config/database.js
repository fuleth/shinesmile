const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // For Azure use true
    trustServerCertificate: true, // For local dev / self-signed certs
    enableArithAbort: true
  }
};

let pool;

async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server database');
    
    // Create tables if they don't exist
    await createTables();
    
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function createTables() {
  try {
    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) UNIQUE NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        fullName NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20),
        role NVARCHAR(20) DEFAULT 'user',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      )
    `);

    // Create Appointments table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' AND xtype='U')
      CREATE TABLE Appointments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        fullName NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20) NOT NULL,
        service NVARCHAR(100) NOT NULL,
        appointmentDate DATE NOT NULL,
        timeSlot NVARCHAR(20) NOT NULL,
        status NVARCHAR(20) DEFAULT 'pending',
        notes NVARCHAR(500),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

async function getPool() {
  if (!pool) {
    await connectDB();
  }
  return pool;
}

module.exports = {
  connectDB,
  getPool,
  sql
}; 