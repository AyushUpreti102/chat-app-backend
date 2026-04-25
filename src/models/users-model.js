const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    profilePic: {
      type: String,
      default: "",
    },

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index({ username: "text", email: "text" });

module.exports = mongoose.model("User", userSchema);
