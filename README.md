# ShineSmile Dental Services Backend

A comprehensive backend solution for managing dental service appointments and user accounts, built with Node.js, Express.js, and SQL Server.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Appointment Management**: Book, view, update, and cancel dental appointments
- **Time Slot Management**: Check availability and manage appointment time slots
- **User Dashboard**: View personal appointment history
- **Security**: Password hashing, input validation, and CORS protection
- **SQL Server Integration**: Robust database storage with SQL Server 2014

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQL Server 2014 Management Studio
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **Input Validation**: express-validator
- **Database Driver**: mssql

## Prerequisites

- Node.js (v14 or higher)
- SQL Server 2014 Management Studio
- SQL Server instance running on localhost:1433

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure database**:
   - Open SQL Server Management Studio
   - Connect to your SQL Server instance
   - Create a new database named `shinesmile`
   - Update the database credentials in `config.env`

4. **Set up environment variables**:
   ```bash
   # Copy the config file
   copy config.env .env
   ```
   
   Then edit `.env` with your SQL Server credentials:
   ```
   PORT=5000
   DB_SERVER=localhost
   DB_DATABASE=shinesmile
   DB_USER=sa
   DB_PASSWORD=your_password
   DB_PORT=1433
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

## Quick Start

### Windows
```bash
# Run the installation script
install.bat

# Start the server
npm start
```

### Linux/Mac
```bash
# Run the installation script
chmod +x install.sh
./install.sh

# Start the server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Appointments
- `POST /api/appointments/book` - Book a new appointment (protected)
- `GET /api/appointments/my-appointments` - Get user's appointments (protected)
- `GET /api/appointments/:id` - Get specific appointment (protected)
- `PUT /api/appointments/:id` - Update appointment (protected)
- `PATCH /api/appointments/:id/cancel` - Cancel appointment (protected)
- `GET /api/appointments/available-slots/:date` - Get available time slots (protected)

## Database Schema

### Users Table
```sql
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
```

### Appointments Table
```sql
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
```

## Frontend Integration

The backend is designed to work with the existing HTML frontend:

- **User Registration**: `register.html`
- **User Login**: `login.html`
- **Service Booking**: `services.html`
- **User Dashboard**: `dashboard.html`

### Key Features
- JWT token storage in localStorage
- Automatic form submission to API endpoints
- Real-time validation and error handling
- Responsive user interface

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using express-validator
- **SQL Injection Protection**: Parameterized queries with mssql
- **CORS Protection**: Cross-origin request handling
- **Error Handling**: Proper error responses without sensitive data exposure

## Project Structure

```
shinesmile/
├── config/
│   └── database.js          # SQL Server connection and table creation
├── models/
│   ├── User.js              # User model with SQL Server operations
│   └── Appointment.js       # Appointment model with SQL Server operations
├── routes/
│   ├── auth.js              # Authentication routes
│   └── appointments.js      # Appointment management routes
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
├── config.env               # Environment variables template
├── test-backend.js          # Backend testing script
├── install.bat              # Windows installation script
├── install.sh               # Unix installation script
└── README.md               # This file
```

## Testing

Run the automated test script to verify all functionality:

```bash
npm test
```

This will test:
- Server connection
- User registration and login
- Appointment booking
- Appointment retrieval
- Time slot availability
- Appointment cancellation

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify SQL Server is running
   - Check database credentials in `.env`
   - Ensure database `shinesmile` exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process on port 5000

3. **JWT Token Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in `.env`

4. **CORS Errors**
   - Verify frontend is served from the same origin
   - Check CORS configuration in server.js

### SQL Server Setup

1. **Enable SQL Server Authentication**:
   - Open SQL Server Management Studio
   - Right-click server → Properties → Security
   - Enable "SQL Server and Windows Authentication mode"

2. **Create Database**:
   ```sql
   CREATE DATABASE shinesmile;
   ```

3. **Create Login** (if needed):
   ```sql
   CREATE LOGIN sa WITH PASSWORD = 'your_password';
   USE shinesmile;
   CREATE USER sa FOR LOGIN sa;
   EXEC sp_addrolemember 'db_owner', 'sa';
   ```

## Development

### Adding New Features

1. **New API Endpoints**: Add routes in `routes/` directory
2. **Database Changes**: Update models and run migration scripts
3. **Frontend Integration**: Update HTML files with new API calls

### Environment Variables

- `PORT`: Server port (default: 5000)
- `DB_SERVER`: SQL Server hostname
- `DB_DATABASE`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_PORT`: Database port (default: 1433)
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment mode

## License

MIT License - feel free to use this project for your dental practice or learning purposes. 