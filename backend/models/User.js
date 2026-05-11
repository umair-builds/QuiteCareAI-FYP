const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String }, // Optional for OAuth users
  email:    { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users
  
  // --- OAUTH FIELDS ---
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },
  avatar: { type: String },
  provider: { type: String, default: 'local' },
  // --------------------
  
  // --- ADD THESE FOR OTP ---
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  // ------------------------
  
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);