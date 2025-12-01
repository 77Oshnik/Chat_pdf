const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
  getChatSession,
  deleteChatSession,
  getPDFChatSessions,
} = require('../controllers/chatController');
const protect = require('../middlewares/auth');
const { chatLimiter } = require('../middlewares/rateLimiter');
const { chatMessageValidator } = require('../validators/chatValidator');

// All routes are protected
router.use(protect);

// Chat routes
router.post('/:pdfId', chatLimiter, chatMessageValidator, sendMessage);
router.get('/history', getChatHistory);
router.get('/session/:sessionId', getChatSession);
router.delete('/session/:sessionId', deleteChatSession);
router.get('/pdf/:pdfId', getPDFChatSessions);

module.exports = router;
