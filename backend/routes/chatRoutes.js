const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/save', chatController.saveSession);
router.get('/history/:userId', chatController.getHistory);
router.get('/:id', chatController.getChatById);
router.delete('/:id', chatController.deleteSession);
router.patch('/:id/pin', chatController.pinSession);
router.patch('/:id/rename', chatController.renameSession);

module.exports = router;