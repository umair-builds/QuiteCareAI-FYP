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

    // 2. Wait until we have at least 6 messages (Intro + 2 User inputs + 2 AI replies)
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
        { new: true }
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

// @desc    Get all past sessions for the sidebar — pinned first, then newest
exports.getHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.params.userId })
      .select('title createdAt isPinned pinnedAt');

    // Sort: pinned first (by pinnedAt desc), then unpinned by createdAt desc
    chats.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) return new Date(b.pinnedAt) - new Date(a.pinnedAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

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

// @route   PATCH /api/chat/:id/pin
// @desc    Toggle pin on a session (max 3 pinned per user)
exports.pinSession = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // If currently pinned → unpin it
    if (chat.isPinned) {
      chat.isPinned = false;
      chat.pinnedAt = null;
      await chat.save();
      return res.json({ message: "Session unpinned", chat });
    }

    // If not pinned → check limit (max 3 per user)
    const pinnedCount = await Chat.countDocuments({ user: chat.user, isPinned: true });
    if (pinnedCount >= 3) {
      return res.status(400).json({ message: "Max 3 sessions can be pinned. Unpin one to continue." });
    }

    chat.isPinned = true;
    chat.pinnedAt = new Date();
    await chat.save();
    res.json({ message: "Session pinned", chat });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   PATCH /api/chat/:id/rename
// @desc    Rename a session title
exports.renameSession = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { title: title.trim() },
      { new: true }
    );

    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json({ message: "Session renamed", chat });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};