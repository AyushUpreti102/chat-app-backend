const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;
