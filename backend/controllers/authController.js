const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
  console.log("1. Backend received signup request"); // <--- Debug Log

  try {
    const { username, email, password } = req.body;
    console.log("2. Data received:", { username, email }); // <--- See if data arrived

    // Check if data is empty
    if (!username || !email || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists");
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User Object
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // --- CRITICAL STEP: SAVE TO DB ---
    console.log("3. Attempting to save to MongoDB...");
    const savedUser = await newUser.save(); // <--- Make sure 'await' is here!
    console.log("4. ✅ User saved successfully with ID:", savedUser._id);
    // ---------------------------------

    res.status(201).json({ 
      message: "User created successfully!", 
      user: savedUser._id 
    });

  } catch (err) {
    console.error("❌ ERROR inside Controller:", err.message); // <--- Print error to terminal
    res.status(500).json({ message: err.message });
  }
};

exports.signin = async (req, res) => {
  res.json({ message: "Sign In Logic goes here later" });
};