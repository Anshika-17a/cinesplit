const express = require('express');
const { processChat } = require('../controllers/chatbotController');

const router = express.Router();

router.post('/message', processChat);

module.exports = router;
