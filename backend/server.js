require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Whitelist: Vite dev server (local) + live Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'https://quite-care-ai-fyp-imz9.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const testRoutes = require('./routes/testRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/test', testRoutes);

// Health-check — lets Vercel / uptime monitors verify the server is alive
app.get('/', (req, res) => res.json({ status: 'ok', project: 'QuietCareAI Backend' }));

// ─── DATABASE CONNECTION ──────────────────────────────────────────────────────
// MONGODB_URI must be set in .env (locally) and in Vercel Environment Variables (production).
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set. Add it to .env (local) or Vercel Environment Variables.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ DB Connection Error:', err.message);
    console.error('ℹ️  Atlas tip: whitelist your server IP in Atlas → Security → Network Access.');
    process.exit(1);
  });

// ─── SERVER LISTEN ────────────────────────────────────────────────────────────
// On Vercel, the file is imported as a serverless function — no need to call
// app.listen(). Locally, we listen on PORT 5005.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5005;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

// Export for Vercel serverless runtime
module.exports = app;