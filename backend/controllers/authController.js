const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // <--- 1. Import Nodemailer

// --- 2. CONFIGURE EMAIL TRANSPORTER ---
// (Use your real Gmail and App Password here)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fixiit098@gmail.com', // REPLACE THIS
    pass: 'tvuk dudp ibnm hqyj'      // REPLACE THIS
  }
});

// @desc    Register a new user
exports.signup = async (req, res) => {
  console.log("1. Backend received signup request"); 
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    console.log("✅ User saved:", savedUser._id);

    res.status(201).json({ 
      message: "User created successfully!", 
      user: { id: savedUser._id, username: savedUser.username, email: savedUser.email } 
    });
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Sign In User
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token: "dummy-token-for-now"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 3. NEW: FORGOT PASSWORD (Send OTP) ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB (Expires in 10 mins)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send Email
    const mailOptions = {
      from: 'QuietCare AI <noreply@quietcare.com>',
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error sending email" });
      }
      res.json({ message: "OTP sent to your email!" });
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 4. NEW: RESET PASSWORD (Verify & Update) ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() } // Check expiry
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful!" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};