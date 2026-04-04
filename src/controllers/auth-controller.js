const User = require("../models/users-model");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

class AuthController {
  async register(req, res) {
    const { username, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({ username, email, password: hashedPassword });
      await user.save();

      res.json({ message: "User registered successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async login(req, res) {
    const { usernameOREmail, password } = req.body;

    try {
      const user = await User.findOne({
        $or: [{ email: usernameOREmail }, { username: usernameOREmail }],
      });
      if (!user) {
        res.status(400).json({ message: "Invalid credentials" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ message: "Invalid credentials" });
        return;
      }

      req.session.userId = user._id;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        res.json({
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
          },
        });
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  me(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ isAuth: false });
    }

    res.json({
      isAuth: true,
      userId: req.session.userId,
    });
  }

  logout(req, res) {
    // If no session exists
    if (!req.session) {
      return res.status(200).json({ message: "Already logged out" });
    }

    // Destroy session in store (Mongo)
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Clear cookie in browser
      res.clearCookie("sid", {
        httpOnly: true,
        secure: process.env.ENV === "PROD", // true in production (HTTPS)
        sameSite: "lax",
      });

      return res.json({ message: "Logged out successfully" });
    });
  }
}

module.exports = AuthController;
