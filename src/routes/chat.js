const express = require("express");
const ChatController = require("../controllers/chat-controller");

const controller = new ChatController();

const router = express.Router();

// (Optional) Get all conversations for a user
router.get("/conversations/:userId", controller.getAllConversions);

// Get chat history between two users
router.get("/:userId/:otherUserId", controller.getChatHistory);

module.exports = router;
