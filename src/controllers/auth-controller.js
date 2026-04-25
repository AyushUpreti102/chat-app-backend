const User = require("../models/users-model");
const bcrypt = require("bcryptjs");

class AuthController {
  /* ================= REGISTER ================= */

  async register(req, res) {
    try {
      let { username, email, password } = req.body;

      // 🔥 validation
      if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      username = username.trim();
      email = email.toLowerCase().trim();

      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
      }

      // 🔥 check existing user (email OR username)
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            existingUser.email === email
              ? "Email already in use"
              : "Username already taken",
        });
      }

      // 🔥 hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      res.status(201).json({
        message: "User registered successfully",
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }

  /* ================= LOGIN ================= */

  async login(req, res) {
    try {
      let { usernameOREmail, password } = req.body;

      if (!usernameOREmail || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      usernameOREmail = usernameOREmail.trim();

      // 🔥 find user
      const user = await User.findOne({
        $or: [
          { email: usernameOREmail.toLowerCase() },
          { username: usernameOREmail },
        ],
      }).select("+password");

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // 🔥 compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // 🔥 prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regenerate error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        req.session.userId = user._id;

        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Login failed" });
          }

          res.json({
            user: {
              _id: user._id,
              username: user.username,
              email: user.email,
              profilePic: user.profilePic || "",
            },
          });
        });
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }

  /* ================= ME ================= */

  async me(req, res) {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ isAuth: false });
      }

      const user = await User.findById(req.session.userId).select(
        "_id username email profilePic",
      );

      if (!user) {
        return res.status(404).json({
          isAuth: false,
          message: "User not found",
        });
      }

      res.json({
        isAuth: true,
        user,
      });
    } catch (err) {
      console.error("Me API error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }

  /* ================= LOGOUT ================= */

  logout(req, res) {
    if (!req.session) {
      return res.json({ message: "Already logged out" });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      res.clearCookie("sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.json({ message: "Logged out successfully" });
    });
  }
}

module.exports = AuthController;
