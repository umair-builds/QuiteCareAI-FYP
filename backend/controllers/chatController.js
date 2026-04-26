const Chat = require('../models/Chat');
const axios = require('axios');

exports.saveSession = async (req, res) => {
  try {
    const { userId, messages, chatId, existingTitle } = req.body;

    // 1. Validation: Don't save empty chats
    if (!messages || messages.length <= 1) {
      return res.status(200).json({ message: "Session empty, not saved." });
    }

    let generatedTitle = existingTitle || "New Sign Session";

    // 2. [UPDATED] Wait until we have at least 6 messages (Intro + 2 User inputs + 2 AI replies)
    if (messages.length >= 6 && generatedTitle === "New Sign Session") {
      try {
        const aiResponse = await axios.post('http://localhost:8000/generate-title', {
            messages: messages
        });
        generatedTitle = aiResponse.data.title;
      } catch (aiErr) {
        console.error("AI Title Generation Failed:", aiErr.message);
      }
    }

    // 3. If the chat already exists, UPDATE it silently
    if (chatId) {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId, 
        { messages: messages, title: generatedTitle },
        { new: true } // Returns the updated document
      );
      return res.status(200).json({ message: "Chat Updated", chat: updatedChat });
    }

    // 4. If it's the first message, CREATE a new chat
    const newChat = new Chat({
      user: userId,
      title: generatedTitle,
      messages: messages
    });

    await newChat.save();
    res.status(201).json({ message: "Chat Created", chat: newChat });

  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all past sessions for the sidebar
exports.getHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.params.userId })
      .sort({ createdAt: -1 }) // Newest first
      .select('title createdAt'); 
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   DELETE /api/chat/:id
exports.deleteSession = async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};