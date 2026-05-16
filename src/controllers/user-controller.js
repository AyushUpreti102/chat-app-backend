const mongoose = require("mongoose");
const User = require("../models/users-model");
const Conversation = require("../models/conversation-model");
const { userSockets, isOnline } = require("../websocket");

const MAX_SEARCH_QUERY_LEN = 64;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class UserController {
  async searchUsers(req, res) {
    try {
      const userId = req.session.userId;
      const raw = String(req.query.query ?? "").trim();

      if (raw.length < 2) {
        return res.json([]);
      }

      const q = raw.slice(0, MAX_SEARCH_QUERY_LEN);
      const pattern = new RegExp(escapeRegex(q), "i");

      const users = await User.find({
        _id: { $ne: userId },
        $or: [{ username: pattern }, { email: pattern }],
      })
        .select("username email profilePic")
        .limit(20)
        .lean();

      res.json(users);
    } catch (error) {
      console.error("USER SEARCH ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async startConversationWithUser(req, res) {
    try {
      const userId = req.session.userId;
      const { peerId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ message: "Invalid session" });
      }

      if (!peerId) {
        return res.status(400).json({ message: "peerId is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(peerId)) {
        return res.status(400).json({ message: "Invalid peerId" });
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const peerObjectId = new mongoose.Types.ObjectId(peerId);

      if (peerObjectId.equals(userObjectId)) {
        return res.status(400).json({ message: "Cannot start a conversation with yourself" });
      }

      const peer = await User.findById(peerObjectId)
        .select("username email profilePic")
        .lean();

      if (!peer) {
        return res.status(404).json({ message: "User not found" });
      }

      const userIdStr = userObjectId.toString();
      const peerIdStr = peerObjectId.toString();

      let conversation = await Conversation.findOne({
        participants: { $all: [userObjectId, peerObjectId], $size: 2 },
      }).lean();

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [userObjectId, peerObjectId],
          unreadCount: {
            [userIdStr]: 0,
            [peerIdStr]: 0,
          },
        });
        conversation = conversation.toObject();
      }

      res.json({
        conversationId: conversation._id,
        user: peer,
      });
    } catch (error) {
      console.error("START CONVERSATION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

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

      const result = conversations.reduce((list, conv) => {
        const otherUser = conv.participants.find(
          (p) => p && p._id.toString() !== userIdKey,
        );

        if (!otherUser) return list;

        const unreadCount =
          conv.unreadCount instanceof Map
            ? conv.unreadCount.get(userIdKey) || 0
            : conv.unreadCount?.[userIdKey] || 0;

        list.push({
          conversationId: conv._id,
          user: otherUser,
          isOnline: isOnline(otherUser._id.toString()),
          lastMessage: conv.lastMessage?.text || "",
          lastMessageTime: conv.lastMessage?.createdAt || null,
          unreadCount,
        });

        return list;
      }, []);

      res.json(result);
    } catch (error) {
      console.error("CHAT LIST ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = UserController;
