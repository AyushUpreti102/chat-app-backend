const User = require("../models/users-model");
const Chat = require("../models/chats-model");

class UserController {
  async getUserFriends(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).populate(
        "friends",
        "username email",
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
        }),
      );

      res.json({ friends: contactsWithLastMessage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getSuggestions(req, res) {
    try {
      const user = await User.findById(req.params.userId);

      const suggestions = await User.find({
        _id: {
          $ne: user._id,
          $nin: user.friends,
        },
      }).select("username email");

      res.json({ suggestions });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async addFriend(req, res) {
    try {
      const { userId, friendId } = req.params;

      const user = await User.findById(userId);
      const friend = await User.findById(friendId);

      if (user.friends.includes(friendId)) {
        return res.status(400).json({ message: "Already friends" });
      }

      user.friends.push(friendId);
      friend.friends.push(userId);

      await user.save();
      await friend.save();

      res.json({ message: "Friend added" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async removeFriend(req, res) {
    try {
      const { userId, friendId } = req.params;

      await User.findByIdAndUpdate(userId, {
        $pull: { friends: friendId },
      });

      await User.findByIdAndUpdate(friendId, {
        $pull: { friends: userId },
      });

      res.json({ message: "Friend removed" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = UserController;
