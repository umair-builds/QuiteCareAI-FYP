const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');

// Route to create fake data
router.get('/create-fake-data', async (req, res) => {
  try {
    // 1. Create Fake User
    const fakeUser = new User({
      username: "Test Student",
      email: "student@fyp.com",
      password: "123" 
    });
    const savedUser = await fakeUser.save();

    // 2. Create Fake Chat
    const fakeChat = new Chat({
      user: savedUser._id,
      title: "Daily Check-in",
      messages: [
        { sender: 'user', text: 'HELLO (Gloss)' },
        { sender: 'bot', text: 'Hello! How are you feeling today?' }
      ]
    });
    await fakeChat.save();

    res.json({ message: "✅ Success! Data created.", user: savedUser, chat: fakeChat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;