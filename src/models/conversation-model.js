const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    lastMessage: {
      text: String,

      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      createdAt: Date,
    },

    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

/* exactly 2 participants */
conversationSchema.index({ participants: 1 });

conversationSchema.index({
  updatedAt: -1,
});

module.exports = mongoose.model("Conversation", conversationSchema);
