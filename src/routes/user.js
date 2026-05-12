const dotenv = require("dotenv");
const express = require("express");
const isAuthenticated = require("../middleware/auth");
const UserController = require("../controllers/user-controller");

dotenv.config();

const controller = new UserController();

const router = express.Router();

router.use(isAuthenticated);

router.get("/search", controller.searchUsers);
router.post("/startConversation", controller.startConversationWithUser);
router.get("/getChatList", controller.getChatList);

module.exports = router;
