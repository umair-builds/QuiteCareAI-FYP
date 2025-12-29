const Chat = require('../models/Chat');

// @desc    Save a finished session
// @route   POST /api/chat/save
exports.saveSession = async (req, res) => {
  try {
    const { userId, messages } = req.body;

    // 1. Validation: Don't save empty chats (Bot hello only)
    // If only 1 message exists, it's just the bot saying "Hello", so we ignore it.
    if (!messages || messages.length <= 1) {
      return res.status(200).json({ message: "Session empty, not saved." });
    }

    // 2. Generate Title (Auto-Increment)
    // Count how many chats this user already has
    const count = await Chat.countDocuments({ user: userId });
    const sessionNumber = (count + 1).toString().padStart(2, '0'); // Turns 1 into "01"
    const autoTitle = `Stressless Session ${sessionNumber}`;

    // 3. Create & Save
    const newChat = new Chat({
      user: userId,
      title: autoTitle,
      messages: messages
    });

    await newChat.save();

    res.status(201).json({ 
      message: "Chat Saved Successfully", 
      chat: newChat 
    });

  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all past sessions for the sidebar
// @route   GET /api/chat/history/:userId
exports.getHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.params.userId })
                            .sort({ createdAt: -1 }) // Newest first
                            .select('title createdAt'); // Only send titles, not full messages
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