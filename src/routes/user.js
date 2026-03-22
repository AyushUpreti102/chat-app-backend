const dotenv = require("dotenv");
const express = require("express");
const UserController = require("../controllers/user-controller");

dotenv.config();

const controller = new UserController();

const router = express.Router();

router.use(express.json());

// Register Route
router.get("/friends/:userId", controller.getUserFriends);
router.get("/suggestions/:userId", controller.getSuggestions);
router.post("/:userId/add-friend/:friendId", controller.addFriend);
router.delete("/:userId/remove-friend/:friendId", controller.removeFriend);

module.exports = router;
