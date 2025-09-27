const User = require("../models/users-model");
const bcrypt = require("bcryptjs");

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

      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AuthController;
