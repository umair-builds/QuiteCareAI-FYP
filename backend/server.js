require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://quite-care-ai-fyp-imz9.vercel.app', // Vercel default
  'https://quietcareai.app',                   // Your custom domain
  'https://www.quietcareai.app'               // Your custom domain with www
];

app.use(cors({
  origin: (origin, callback) => {
    // The !origin check allows mobile apps and tools like Postman
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS Blocked Origin:", origin); // This helps you see the error in Vercel logs
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
})
);

app.use(express.json());
app.use(passport.initialize());

// --- 1. FAVICON & STATIC ASSET HANDLER ---
// Handle favicon requests early to avoid unnecessary DB connection attempts
app.get(['/favicon.ico', '/favicon.png'], (req, res) => res.status(204).end());

// --- 2. SERVERLESS-SAFE DATABASE CONNECTION ---
const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection; // Reuse active connection
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing from environment variables');
    throw new Error('MONGODB_URI is missing from environment variables');
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err;
  }
};

// --- 3. DATABASE CONNECTION MIDDLEWARE ---
// Ensure DB is connected before processing API requests
app.use(async (req, res, next) => {
  // Exempt the health check path from DB connection requirement
  if (req.path === '/' || req.path.startsWith('/favicon')) {
    return next();
  }

  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ 
      error: "Database connection failed", 
      message: "The server is unable to connect to the database. Please check your MONGODB_URI and IP whitelist.",
      details: err.message 
    });
  }
});

// --- 4. API ROUTES ---
const authRoutes = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const chatRoutes = require('./routes/chatRoutes');
const testRoutes = require('./routes/testRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // Mount OAuth routes
app.use('/api/chat', chatRoutes);
app.use('/api/test', testRoutes);

// Health check endpoint
app.get('/', (req, res) => res.json({ status: 'ok', project: 'QuietCareAI Backend' }));

// --- 5. SERVER LISTEN (Local Development) ---
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5005;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

// Global Error Handler for Vercel debugging
app.use((err, req, res, next) => {
  console.error("Global Error Handler Caught:", err);
  res.status(500).send(`Internal Server Error: ${err.message || err}`);
});

module.exports = app;