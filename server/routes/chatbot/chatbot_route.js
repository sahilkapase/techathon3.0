const express = require('express');
const router = express.Router();
const chatbot_controller = require('../../controllers/chatbot_controller');

// Send message to AI chatbot
router.post('/message', chatbot_controller.sendMessage);

// Clear conversation history
router.delete('/history/:farmerId', chatbot_controller.clearHistory);

module.exports = router;
