const express = require("express");
const isAuthenticated = require("../middleware/auth");
const ChatController = require("../controllers/chat-controller");
const router = express.Router();

const controller = new ChatController();

router.use(isAuthenticated);

router.get("/conversations", controller.getAllConversions);
router.get("/history/:otherUserId", controller.getChatHistory);

module.exports = router;
