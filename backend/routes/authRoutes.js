const express = require('express');
const router = express.Router();
// Import the controller
const authController = require('../controllers/authController');

// Link the URL to the Controller Function
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

module.exports = router;