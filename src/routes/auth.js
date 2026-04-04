const express = require("express");
const AuthController = require("../controllers/auth-controller");

const controller = new AuthController();

const router = express.Router();

router.use(express.json());

router.post("/signup", controller.register);
router.post("/login", controller.login);
router.get("/me", controller.me);
router.post("/logout", controller.logout);

module.exports = router;
