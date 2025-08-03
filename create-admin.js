const bcrypt = require('bcryptjs');
const { getPool, sql } = require('./config/database');

async function createAdminUser() {
  try {
    const pool = await getPool();
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Check if admin user already exists
    const checkResult = await pool.request()
      .input('email', sql.NVarChar, 'admin@shinesmile.com')
      .query('SELECT id FROM Users WHERE email = @email');
    
    if (checkResult.recordset.length > 0) {
      console.log('Admin user already exists!');
      return;
    }
    
    // Create admin user
    const result = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .input('email', sql.NVarChar, 'admin@shinesmile.com')
      .input('password', sql.NVarChar, hashedPassword)
      .input('fullName', sql.NVarChar, 'Admin User')
      .input('phone', sql.NVarChar, '1234567890')
      .input('role', sql.NVarChar, 'admin')
      .query(`
        INSERT INTO Users (username, email, password, fullName, phone, role)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.fullName, INSERTED.role
        VALUES (@username, @email, @password, @fullName, @phone, @role)
      `);
    
    console.log('Admin user created successfully!');
    console.log('Email: admin@shinesmile.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 