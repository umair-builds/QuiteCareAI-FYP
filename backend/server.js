require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // <--- Enable CORS
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const testRoutes = require('./routes/testRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/test', testRoutes);

const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fyp_db';

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    console.error(
      'ℹ️ Atlas check: add your current public IP in Atlas Network Access (Security -> Network Access), then retry.'
    );
    process.exit(1);
  }
}

startServer();