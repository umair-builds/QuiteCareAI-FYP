const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/save', protect, chatController.saveSession);
router.get('/history/:userId', protect, chatController.getHistory);
router.get('/:id', protect, chatController.getChatById);
router.delete('/:id', protect, chatController.deleteSession);
router.patch('/:id/pin', protect, chatController.pinSession);
router.patch('/:id/rename', protect, chatController.renameSession);

module.exports = router;