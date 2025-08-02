-- ShineSmile Dental Services Database Setup Script
-- SQL Server 2014 Management Studio

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'shinesmile')
BEGIN
    CREATE DATABASE shinesmile;
END
GO

USE shinesmile;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
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
    );
    PRINT 'Users table created successfully';
END
ELSE
BEGIN
    PRINT 'Users table already exists';
END
GO

-- Create Appointments table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' AND xtype='U')
BEGIN
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
    );
    PRINT 'Appointments table created successfully';
END
ELSE
BEGIN
    PRINT 'Appointments table already exists';
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
BEGIN
    CREATE INDEX IX_Users_Email ON Users(email);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Username')
BEGIN
    CREATE INDEX IX_Users_Username ON Users(username);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_UserId')
BEGIN
    CREATE INDEX IX_Appointments_UserId ON Appointments(userId);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_Date')
BEGIN
    CREATE INDEX IX_Appointments_Date ON Appointments(appointmentDate);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_DateSlot')
BEGIN
    CREATE INDEX IX_Appointments_DateSlot ON Appointments(appointmentDate, timeSlot);
END
GO

-- Insert sample data (optional)
-- Uncomment the following section if you want to add sample data

/*
-- Sample Users
INSERT INTO Users (username, email, password, fullName, phone, role) VALUES
('admin', 'admin@shinesmile.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8mG', 'Admin User', '1234567890', 'admin'),
('john_doe', 'john@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8mG', 'John Doe', '9876543210', 'user'),
('jane_smith', 'jane@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8mG', 'Jane Smith', '5551234567', 'user');

-- Sample Appointments
INSERT INTO Appointments (userId, fullName, email, phone, service, appointmentDate, timeSlot, status, notes) VALUES
(2, 'John Doe', 'john@example.com', '9876543210', 'cleaning', '2024-02-15', '09:00 AM', 'confirmed', 'Regular cleaning appointment'),
(3, 'Jane Smith', 'jane@example.com', '5551234567', 'whitening', '2024-02-16', '02:00 PM', 'pending', 'Teeth whitening session');
*/

PRINT 'Database setup completed successfully!';
PRINT 'You can now start the Node.js application.';
GO 