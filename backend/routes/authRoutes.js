const express = require('express');
const router = express.Router();
// Import the controller
const authController = require('../controllers/authController');

// Link the URL to the Controller Function
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

// --- ADD THESE ---
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;

module.exports = router;