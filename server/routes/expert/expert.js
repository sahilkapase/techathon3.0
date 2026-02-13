const express = require('express');
const expert_controller = require('../../controllers/expert_controller');
const router = express.Router();

// Auth Routes
router.post('/registration', expert_controller.registration);
router.post('/expert_login', expert_controller.expertlogin);

// Expert List Routes
router.get('/list_of_experts', expert_controller.list_of_experts);
router.get('/search', expert_controller.searchExpertsByExpertise);
router.get('/email/:Email', expert_controller.getExpertByEmail);

// Farmer-Expert Interaction
router.get('/farmers/:Email', expert_controller.list_of_farmers);
router.post('/send-message', expert_controller.send_message_to_farmer);
router.get('/messages/farmer/:farmerId', expert_controller.get_messages_for_farmer);
router.get('/messages/expert/:expertEmail', expert_controller.get_messages_for_expert);

// Expert Management
router.patch('/update/:Email', expert_controller.updateExpertProfile);
router.delete('/delete/:Email', expert_controller.deleteExpert);

module.exports = router;