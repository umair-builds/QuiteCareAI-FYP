const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Links to the User Model
    ref: 'User',
    required: true
  },
  title: {
    type: String, 
    required: true // e.g., "Daily Check-in", "Practice Session"
  },
  messages: [
    {
      sender: { type: String, enum: ['user', 'bot'], required: true }, // Who sent it?
      text:   { type: String, required: true }, // The English text or Gloss
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);