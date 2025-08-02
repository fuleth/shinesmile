const bcrypt = require('bcryptjs');
const { getPool, sql } = require('./config/database');

async function createAdminUser() {
  try {
    const pool = await getPool();
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const result = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .input('email', sql.NVarChar, 'admin@shinesmile.com')
      .input('password', sql.NVarChar, hashedPassword)
      .input('fullName', sql.NVarChar, 'Admin User')
      .input('phone', sql.NVarChar, '1234567890')
      .input('role', sql.NVarChar, 'admin')
      .query(`
        INSERT INTO Users (username, email, password, fullName, phone, role)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.fullName, INSERTED.phone, INSERTED.role
        VALUES (@username, @email, @password, @fullName, @phone, @role)
      `);
    
    console.log('Admin user created successfully:', result.recordset[0]);
    console.log('Login credentials:');
    console.log('Email: admin@shinesmile.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser(); 