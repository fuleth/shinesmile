const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

class User {
  static async create(userData) {
    try {
      const pool = await getPool();
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const result = await pool.request()
        .input('username', sql.NVarChar, userData.username)
        .input('email', sql.NVarChar, userData.email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('fullName', sql.NVarChar, userData.fullName)
        .input('phone', sql.NVarChar, userData.phone || null)
        .query(`
          INSERT INTO Users (username, email, password, fullName, phone)
          OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.fullName, INSERTED.phone, INSERTED.role, INSERTED.createdAt
          VALUES (@username, @email, @password, @fullName, @phone)
        `);
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT * FROM Users WHERE email = @email');
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Users WHERE id = @id');
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .query('SELECT * FROM Users WHERE username = @username');
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async updateById(id, updateData) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('fullName', sql.NVarChar, updateData.fullName)
        .input('phone', sql.NVarChar, updateData.phone)
        .input('updatedAt', sql.DateTime, new Date())
        .query(`
          UPDATE Users 
          SET fullName = @fullName, phone = @phone, updatedAt = @updatedAt
          OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.fullName, INSERTED.phone, INSERTED.role
          WHERE id = @id
        `);
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User; 