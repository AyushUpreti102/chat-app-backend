const dotenv = require("dotenv");
const express = require("express");
const isAuthenticated = require("../middleware/auth");
const UserController = require("../controllers/user-controller");

dotenv.config();

const controller = new UserController();

const router = express.Router();

router.use(isAuthenticated);

// Register Route
router.get("/friends", controller.getUserFriends);
router.get("/suggestions", controller.getSuggestions);
router.post("/add-friend/:friendId", controller.addFriend);
router.delete("/remove-friend/:friendId", controller.removeFriend);

module.exports = router;
