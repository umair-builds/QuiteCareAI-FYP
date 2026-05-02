require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://quite-care-ai-fyp-imz9.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
})
);

app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const testRoutes = require('./routes/testRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/test', testRoutes);

app.get('/', (req, res) => res.json({ status: 'ok', project: 'QuietCareAI Backend' }));

// --- CACHED DATABASE CONNECTION ---
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) return cachedDb; // Reuse connection

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from environment variables');
  }

  // Connect without process.exit()
  const db = await mongoose.connect(MONGODB_URI);
  cachedDb = db;
  console.log('✅ MongoDB Connected');
  return db;
};

// Middleware to ensure DB is connected before any request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed", message: err.message });
  }
});

// --- SERVER LISTEN ---
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5005;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;