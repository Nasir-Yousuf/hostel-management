/**
 * NIYD Hostel Management System - Database Connection
 */
const mongoose = require('mongoose');

const connectDB = async (customUri) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // During automated tests, allow mongodb-memory-server to manage the connection
  if (process.env.NODE_ENV === 'test' && !customUri) {
    return;
  }

  const uri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/niyd_hms';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB Connection Error] Could not connect to: ${uri}`);
    console.error(`Reason: ${err.message}`);
    // In production we exit, in dev we allow inspection and retry
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected to database.');
});

module.exports = connectDB;
