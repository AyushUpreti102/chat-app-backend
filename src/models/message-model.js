const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    files: [
      {
        fileUrl: String,
        fileName: String,
      },
    ],

    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.pre("validate", function (next) {
  const hasText = typeof this.text === "string" && this.text.trim().length > 0;

  const hasFiles = Array.isArray(this.files) && this.files.length > 0;

  if (!hasText && !hasFiles) {
    return next(new Error("Message must have text or file"));
  }

  next();
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
