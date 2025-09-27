const express = require("express");
const AuthController = require("../controllers/auth-controller");

const controller = new AuthController();

const router = express.Router();

router.use(express.json());

// Register Route
router.post("/signup", controller.register);
// Login Route
router.post("/login", controller.login);

module.exports = router;
