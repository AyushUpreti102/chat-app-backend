const Conversation = require("../models/conversation-model");
const Message = require("../models/message-model");
const mongoose = require("mongoose");

async function findOrCreateConversation(userId, receiverId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
  const userIdStr = userObjectId.toString();
  const receiverIdStr = receiverObjectId.toString();

  let conversation = await Conversation.findOne({
    participants: { $all: [userObjectId, receiverObjectId], $size: 2 },
  });

  if (conversation) return conversation;

  return Conversation.create({
    participants: [userObjectId, receiverObjectId],
    unreadCount: {
      [userIdStr]: 0,
      [receiverIdStr]: 0,
    },
  });
}

class ChatController {
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const page = Number(req.query.page || 1);
      const limit = 30;
      const skip = (page - 1) * limit;

      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.json(messages.reverse());
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { conversationId } = req.body;
      const userId = req.session.userId;

      await Promise.all([
        Conversation.updateOne(
          { _id: conversationId },
          { $set: { [`unreadCount.${userId}`]: 0 } },
        ),

        Message.updateMany(
          {
            conversationId,
            receiver: userId,
            seen: false,
          },
          { $set: { seen: true } },
        ),
      ]);

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async saveMessage(userId, { receiverId, text, files = [] }) {
    try {
      const conversation = await findOrCreateConversation(userId, receiverId);

      const message = await Message.create({
        conversationId: conversation._id,
        sender: userId,
        receiver: receiverId,
        text: text || "",
        files: files || [], // ✅ array
      });

      // 👇 Smart last message preview
      let lastMessageText = "";

      if (text) {
        lastMessageText = text;
      } else if (files?.length) {
        lastMessageText =
          files.length === 1
            ? "📎 Attachment"
            : `📎 ${files.length} attachments`;
      }

      await Conversation.updateOne(
        { _id: conversation._id },
        {
          $set: {
            updatedAt: new Date(),
            lastMessage: {
              text: lastMessageText,
              sender: userId,
              createdAt: new Date(),
            },
          },
          $inc: {
            [`unreadCount.${receiverId}`]: 1,
          },
        },
      );

      return message.toObject(); // ✅ no type
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

module.exports = ChatController;
