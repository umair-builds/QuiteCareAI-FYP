require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quietcare_ai')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log(err));

// --- ROUTES ---
// 1. Auth Routes (Placeholder for now)
app.use('/api/auth', require('./routes/authRoutes'));

// 2. Test Routes (RUN THIS TO CHECK MODELS)
app.use('/api/test', require('./routes/testRoutes'));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));