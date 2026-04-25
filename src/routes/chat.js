const express = require("express");
const isAuthenticated = require("../middleware/auth");
const ChatController = require("../controllers/chat-controller");
const router = express.Router();

const controller = new ChatController();

router.use(isAuthenticated);

router.get("/messages/:conversationId", controller.getMessages);
router.post("/read", controller.markAsRead);

module.exports = router;
