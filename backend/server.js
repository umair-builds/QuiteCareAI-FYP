const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <--- Import CORS

const app = express();

// Middleware
app.use(cors()); // <--- Enable CORS
app.use(express.json());

// --- DATABASE CONNECTION ---
// Replace the string below with your actual MongoDB connection string 
// (or 'mongodb://127.0.0.1:27017/fyp_db' for local)
mongoose.connect('mongodb://127.0.0.1:27017/fyp_db') 
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Connection Error:', err));

// Routes
const authRoutes = require('./routes/authRoutes'); // Ensure path is correct
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));