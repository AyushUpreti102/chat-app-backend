const Chat = require("../models/chats-model");

class ChatController {
  async getChatHistory(req, res) {
    const { userId, otherUserId } = req.params;

    try {
      const messages = await Chat.find({
        $or: [
          { from: userId, to: otherUserId },
          { from: otherUserId, to: userId },
        ],
      }).sort({ createdAt: 1 });

      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAllConversions(req, res) {
    const { userId } = req.params;

    try {
      const chats = await Chat.find({
        $or: [{ from: userId }, { to: userId }],
      })
        .populate("from to", "username")
        .sort({ createdAt: -1 });

      res.json(chats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveMessageToDb(userId, msg) {
    const newMessage = new Chat({
      from: userId,
      to: msg.to,
      text: msg.text,
    });
    await newMessage.save();
  }
}

module.exports = ChatController;
