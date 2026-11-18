/**
 * NIYD Hostel Management System - Express API Server
 * Organization: National Institute of Youth Development, Bangladesh
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/error.middleware');

// Initialize Express App
const app = express();

// Connect to Database
connectDB();

// Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow CDN resources like Chart.js & fonts
    crossOriginEmbedderPolicy: false
  })
);

// CORS Whitelist
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching whitelist
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly fallback
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate Limiting (Protection against brute force & DDoS)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP address. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static Frontend files (Allows serving frontend directly from Node server!)
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health Check Endpoint (Required by Part 15)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    organization: 'National Institute of Youth Development (NIYD), Bangladesh',
    system: 'Hostel Management System (HMS)',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      healthy: dbState === 1
    }
  });
});

// Register API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/admissions', require('./routes/admission.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/fees', require('./routes/fee.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

// 404 Route Catch-all
app.use('/api/*', (req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
let server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🏛️  NIYD Hostel Management System API running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`🌐 Server Port: ${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🏠 Frontend App: http://localhost:${PORT}/frontend/index.html`);
    console.log(`================================================================`);
  });
}

module.exports = { app, server };
