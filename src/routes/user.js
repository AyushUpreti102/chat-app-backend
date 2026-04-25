const dotenv = require("dotenv");
const express = require("express");
const isAuthenticated = require("../middleware/auth");
const UserController = require("../controllers/user-controller");

dotenv.config();

const controller = new UserController();

const router = express.Router();

router.use(isAuthenticated);

// Register Route
router.get("/getChatList", controller.getChatList);

module.exports = router;
