const { getPool, sql } = require('../config/database');

class Appointment {
  static async create(appointmentData) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, appointmentData.userId)
        .input('fullName', sql.NVarChar, appointmentData.fullName)
        .input('email', sql.NVarChar, appointmentData.email)
        .input('phone', sql.NVarChar, appointmentData.phone)
        .input('service', sql.NVarChar, appointmentData.service)
        .input('appointmentDate', sql.Date, appointmentData.appointmentDate)
        .input('timeSlot', sql.NVarChar, appointmentData.timeSlot)
        .input('notes', sql.NVarChar, appointmentData.notes || null)
        .query(`
          INSERT INTO Appointments (userId, fullName, email, phone, service, appointmentDate, timeSlot, notes)
          OUTPUT INSERTED.id, INSERTED.userId, INSERTED.fullName, INSERTED.email, INSERTED.phone, 
                 INSERTED.service, INSERTED.appointmentDate, INSERTED.timeSlot, INSERTED.status, 
                 INSERTED.notes, INSERTED.createdAt, INSERTED.updatedAt
          VALUES (@userId, @fullName, @email, @phone, @service, @appointmentDate, @timeSlot, @notes)
        `);
      
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
        .query(`
          SELECT a.*, u.username, u.fullName as userName
          FROM Appointments a
          JOIN Users u ON a.userId = u.id
          WHERE a.id = @id
        `);
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT a.*, u.username, u.fullName as userName
          FROM Appointments a
          JOIN Users u ON a.userId = u.id
          WHERE a.userId = @userId
          ORDER BY a.appointmentDate DESC, a.createdAt DESC
        `);
      
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .query(`
          SELECT a.*, u.username, u.fullName as userName
          FROM Appointments a
          JOIN Users u ON a.userId = u.id
          ORDER BY a.appointmentDate DESC, a.createdAt DESC
        `);
      
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async updateById(id, updateData) {
  try {
    const pool = await getPool();

    const fields = [];
    const request = pool.request().input('id', sql.Int, id);

    for (const key in updateData) {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, updateData[key]);
      }
    }

    fields.push('updatedAt = GETDATE()'); // luôn cập nhật thời gian

    const query = `
      UPDATE Appointments 
      SET ${fields.join(', ')} 
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
}


  static async deleteById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Appointments WHERE id = @id');
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw error;
    }
  }

  static async checkTimeSlotAvailability(appointmentDate, timeSlot, excludeId = null) {
    try {
      const pool = await getPool();
      let query = `
        SELECT COUNT(*) as count
        FROM Appointments 
        WHERE appointmentDate = @appointmentDate AND timeSlot = @timeSlot
      `;
      
      const request = pool.request()
        .input('appointmentDate', sql.Date, appointmentDate)
        .input('timeSlot', sql.NVarChar, timeSlot);
      
      if (excludeId) {
        query += ' AND id != @excludeId';
        request.input('excludeId', sql.Int, excludeId);
      }
      
      const result = await request.query(query);
      return result.recordset[0].count === 0;
    } catch (error) {
      throw error;
    }
  }

  static async getAvailableTimeSlots(appointmentDate) {
    try {
      const pool = await getPool();
      const allTimeSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
        '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
      ];
      
      const result = await pool.request()
        .input('appointmentDate', sql.Date, appointmentDate)
        .query(`
          SELECT timeSlot
          FROM Appointments 
          WHERE appointmentDate = @appointmentDate
        `);
      
      const bookedSlots = result.recordset.map(record => record.timeSlot);
      return allTimeSlots.filter(slot => !bookedSlots.includes(slot));
    } catch (error) {
      throw error;
    }
  }

  static async getStatistics() {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .query(`
          SELECT 
            COUNT(*) as totalAppointments,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingAppointments,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmedAppointments,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedAppointments,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledAppointments,
            COUNT(CASE WHEN appointmentDate >= GETDATE() THEN 1 END) as upcomingAppointments,
            COUNT(CASE WHEN appointmentDate < GETDATE() THEN 1 END) as pastAppointments
          FROM Appointments
        `);
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Appointment; 