const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // --- ADD THESE FOR OTP ---
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  // ------------------------
  
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);