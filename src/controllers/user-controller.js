const Conversation = require("../models/conversation-model");
const { userSockets, isOnline } = require("../websocket");

class UserController {
  async getChatList(req, res) {
    try {
      const userId = req.session.userId;
      const userIdKey = userId.toString();

      const conversations = await Conversation.find({
        participants: userId,
      })
        .populate("participants", "username email profilePic")
        .sort({ updatedAt: -1 })
        .lean();

      const result = conversations.map((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== userIdKey,
        );

        const unreadCount =
          conv.unreadCount instanceof Map
            ? conv.unreadCount.get(userIdKey) || 0
            : conv.unreadCount?.[userIdKey] || 0;

        return {
          conversationId: conv._id,
          user: otherUser,
          isOnline: isOnline(otherUser._id.toString()),
          lastMessage: conv.lastMessage?.text || "",
          lastMessageTime: conv.lastMessage?.createdAt || null,
          unreadCount,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("CHAT LIST ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = UserController;
