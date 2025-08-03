const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// WebSocket connection handling
const connectedUsers = new Map();
const chatMessages = [];
const adminSockets = new Set(); // Track admin sockets separately

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining chat
  socket.on('join-chat', (userData) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      name: userData.name || 'Anonymous',
      email: userData.email || '',
      isAdmin: userData.isAdmin || false,
      timestamp: new Date()
    });
    
    // Track admin sockets separately for appointment notifications
    if (userData.isAdmin) {
      adminSockets.add(socket.id);
    }
    
    // Send welcome message
    socket.emit('chat-message', {
      id: 'system',
      sender: 'System',
      message: 'Welcome to ShineSmile chat! How can we help you today?',
      timestamp: new Date(),
      isSystem: true
    });

    // Send recent messages to new user
    if (chatMessages.length > 0) {
      socket.emit('chat-history', chatMessages.slice(-10));
    }

    // Notify admin about new user
    if (!userData.isAdmin) {
      io.emit('user-joined', {
        user: connectedUsers.get(socket.id),
        message: `${userData.name || 'Anonymous'} joined the chat`
      });
    }
  });

  // Handle chat messages
  socket.on('send-message', (messageData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now().toString(),
      sender: user.name,
      message: messageData.message,
      timestamp: new Date(),
      userId: socket.id,
      isAdmin: user.isAdmin
    };

    chatMessages.push(message);
    
    // Keep only last 100 messages
    if (chatMessages.length > 100) {
      chatMessages.shift();
    }

    // Broadcast message to all connected users
    io.emit('chat-message', message);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', {
        user: user.name,
        isTyping: isTyping
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      io.emit('user-left', {
        user: user,
        message: `${user.name} left the chat`
      });
      connectedUsers.delete(socket.id);
      
      // Remove from admin sockets if admin
      if (user.isAdmin) {
        adminSockets.delete(socket.id);
      }
    }
    console.log('User disconnected:', socket.id);
  });

  // Handle admin actions
  socket.on('admin-action', (action) => {
    if (action.type === 'get-online-users') {
      const onlineUsers = Array.from(connectedUsers.values()).filter(user => !user.isAdmin);
      socket.emit('online-users', onlineUsers);
    }
  });
});

// Real-time appointment event handlers
const emitAppointmentEvent = (eventType, appointment, userId = null) => {
  const eventData = {
    type: eventType,
    appointment: appointment,
    timestamp: new Date(),
    userId: userId
  };

  // Emit to all connected clients
  io.emit('appointment-update', eventData);
  
  // Log the event
  console.log(`Appointment ${eventType}:`, {
    appointmentId: appointment.id,
    service: appointment.service,
    user: appointment.fullName,
    timestamp: new Date().toISOString()
  });
};

// Export the emit function for use in routes
global.emitAppointmentEvent = emitAppointmentEvent;

// Connect to SQL Server database
connectDB()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Debug middleware for appointments API
app.use('/api/appointments', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve admin dashboard
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});