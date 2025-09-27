const User = require("../models/users-model");
const Chat = require("../models/chats-model");

class UserController {
  async getUserContacts(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).populate(
        "friends",
        "username email"
      );
      if (!user) return res.status(404).json({ message: "User not found" });

      // Build response with last message for each friend
      const contactsWithLastMessage = await Promise.all(
        user.friends.map(async (friend) => {
          const lastMsg = await Chat.findOne({
            $or: [
              { from: userId, to: friend._id },
              { from: friend._id, to: userId },
            ],
          })
            .sort({ createdAt: -1 })
            .limit(1);

          return {
            _id: friend._id,
            username: friend.username,
            email: friend.email,
            lastMessage: lastMsg ? lastMsg.text : null,
            lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          };
        })
      );

      res.json({ friends: contactsWithLastMessage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = UserController;
