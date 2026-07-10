const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/octurion_receptionist';

let connected = false;

async function connectDB() {
  if (connected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    connected = true;
    console.log('[DB] MongoDB connected:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));
  } catch (e) {
    console.error('[DB] MongoDB connection failed:', e.message);
    console.error('[DB] Server will run without database persistence');
  }
}

module.exports = { connectDB, mongoose };
