const dotenv = require("dotenv");
const express = require("express");
const UserController = require("../controllers/user-controller");

dotenv.config();

const controller = new UserController();

const router = express.Router();

router.use(express.json());

// Register Route
router.get("/contacts/:userId", controller.getUserContacts);

module.exports = router;
