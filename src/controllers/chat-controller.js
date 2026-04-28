const Conversation = require("../models/conversation-model");
const Message = require("../models/message-model");

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
      let conversation = await Conversation.findOneAndUpdate(
        { participants: { $all: [userId, receiverId] } },
        {
          $setOnInsert: {
            participants: [userId, receiverId],
            [`unreadCount.${userId}`]: 0,
            [`unreadCount.${receiverId}`]: 0,
          },
        },
        { new: true, upsert: true },
      );

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
