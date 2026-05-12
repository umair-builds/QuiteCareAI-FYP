const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5005';

// Generate JWT token (matches authController.js)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret_key_123', {
    expiresIn: '30d',
  });
};

// Handle OAuth login/signup logic
const handleOAuthUser = async (profile, provider) => {
  const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
  const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
  const username = profile.displayName || profile.username || (email ? email.split('@')[0] : 'User');
  
  // 1. Check if user exists by provider ID
  let user = null;
  if (provider === 'google') {
    user = await User.findOne({ googleId: profile.id });
  } else if (provider === 'github') {
    user = await User.findOne({ githubId: profile.id });
  }

  if (user) return user;

  // 2. If no user by provider ID, check if email exists (link accounts)
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      if (provider === 'google') user.googleId = profile.id;
      if (provider === 'github') user.githubId = profile.id;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
      return user;
    }
  }

  // 3. Create a new user
  user = new User({
    username,
    email: email || `${provider}_${profile.id}@noemail.com`, // fallback for no email
    provider,
    avatar,
  });
  if (provider === 'google') user.googleId = profile.id;
  if (provider === 'github') user.githubId = profile.id;
  
  await user.save();
  return user;
};

// --- PASSPORT GOOGLE STRATEGY ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await handleOAuthUser(profile, 'google');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// --- PASSPORT GITHUB STRATEGY ---
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await handleOAuthUser(profile, 'github');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// --- ROUTES ---

// 1. Google OAuth Routes
router.get(
  '/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.redirect(`${FRONTEND_URL}/signin?error=Google_OAuth_Not_Configured`);
    }
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/signin?error=Login_Failed` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
  }
);

// 2. GitHub OAuth Routes
router.get(
  '/github',
  (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.redirect(`${FRONTEND_URL}/signin?error=GitHub_OAuth_Not_Configured`);
    }
    next();
  },
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${FRONTEND_URL}/signin?error=Login_Failed` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
  }
);

// 3. Current User Route (Validate JWT and return user profile)
router.get('/me', async (req, res) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_123');
    const user = await User.findById(decoded.id).select('-password -resetPasswordOTP -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
});

module.exports = router;
