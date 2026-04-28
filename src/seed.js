const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const User = require("./models/users-model");
const Conversation = require("./models/conversation-model");
const Message = require("./models/message-model");

dotenv.config();

const BASE_URL = "http://localhost:3000";

// ✅ folder path
const uploadDir = path.join(__dirname, "../uploads");

// ✅ files you DON'T want to delete
const KEEP_FILES = ["sample-image.jpg", "sample.pdf"];

// ================= FILE CLEAN FUNCTION =================
async function clearUploads() {
  try {
    console.log("🧹 Cleaning upload folder...");

    if (!fs.existsSync(uploadDir)) return;

    const files = await fs.promises.readdir(uploadDir);
    console.log("files", files);

    await Promise.all(
      files.map(async (file) => {
        // skip seed files
        if (KEEP_FILES.includes(file)) return;

        const filePath = path.join(uploadDir, file);

        try {
          const stat = await fs.promises.lstat(filePath);

          if (stat.isDirectory()) {
            await fs.promises.rm(filePath, {
              recursive: true,
              force: true,
            });
          } else {
            await fs.promises.unlink(filePath);
          }
        } catch (err) {
          // ignore errors (file might already be deleted)
        }
      }),
    );

    console.log("🧹 Upload folder cleaned (except sample files)");
  } catch (err) {
    console.log("⚠️ Upload cleanup skipped:", err.message);
  }
}

// ================= SEED FUNCTION =================
async function seed() {
  try {
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("✅ Mongo Connected");

    /* ================= CLEAN ================= */

    await Promise.all([
      User.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
    ]);

    // ✅ clear uploads AFTER DB fetch/delete
    await clearUploads();

    console.log("🧹 DB Cleared");

    /* ================= USERS ================= */

    const password = await bcrypt.hash("123456", 10);

    function getLastMessagePreview(msg) {
      if (msg.text) return msg.text;

      if (msg.files?.length) {
        return msg.files.length === 1
          ? "📎 Attachment"
          : `📎 ${msg.files.length} attachments`;
      }

      return "";
    }

    const [alice, bob, charlie] = await User.insertMany([
      {
        username: "Alice",
        email: "alice@test.com",
        password,
      },
      {
        username: "Bob",
        email: "bob@test.com",
        password,
      },
      {
        username: "Charlie",
        email: "charlie@test.com",
        password,
      },
    ]);

    console.log("👤 Users Seeded");

    /* ================= CONVERSATIONS ================= */

    const conv1 = await Conversation.create({
      participants: [alice._id, bob._id],
      unreadCount: {
        [alice._id]: 1,
        [bob._id]: 0,
      },
    });

    const conv2 = await Conversation.create({
      participants: [alice._id, charlie._id],
      unreadCount: {
        [alice._id]: 0,
        [charlie._id]: 1,
      },
    });

    /* ================= MESSAGES ================= */

    const now = Date.now();

    const msg1 = await Message.create({
      conversationId: conv1._id,
      sender: alice._id,
      receiver: bob._id,
      text: "Hey Bob 👋",
      createdAt: new Date(now - 1000 * 60 * 10),
    });

    const msg2 = await Message.create({
      conversationId: conv1._id,
      sender: bob._id,
      receiver: alice._id,
      text: "Hey Alice! What's up?",
      createdAt: new Date(now - 1000 * 60 * 8),
    });

    // ✅ TEXT + FILE
    const msg3 = await Message.create({
      conversationId: conv1._id,
      sender: alice._id,
      receiver: bob._id,
      text: "Check this out 😄",
      files: [
        {
          fileUrl: `${BASE_URL}/uploads/sample-image.jpg`,
          fileName: "sample-image.jpg",
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 5),
    });

    // ✅ FILE ONLY
    const msg4 = await Message.create({
      conversationId: conv2._id,
      sender: charlie._id,
      receiver: alice._id,
      files: [
        {
          fileUrl: `${BASE_URL}/uploads/sample.pdf`,
          fileName: "sample.pdf",
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 15),
    });

    // ✅ TEXT ONLY
    const msg5 = await Message.create({
      conversationId: conv2._id,
      sender: alice._id,
      receiver: charlie._id,
      text: "Hey Charlie 👋",
      createdAt: new Date(now - 1000 * 60 * 12),
    });

    console.log("📨 Messages Seeded");

    /* ================= LAST MESSAGE ================= */

    await Promise.all([
      Conversation.findByIdAndUpdate(conv1._id, {
        updatedAt: msg3.createdAt,
        lastMessage: {
          text: getLastMessagePreview(msg3),
          sender: msg3.sender,
          createdAt: msg3.createdAt,
        },
      }),

      Conversation.findByIdAndUpdate(conv2._id, {
        updatedAt: msg5.createdAt,
        lastMessage: {
          text: getLastMessagePreview(msg5),
          sender: msg5.sender,
          createdAt: msg5.createdAt,
        },
      }),
    ]);

    console.log("💬 Conversations Updated");

    console.log("🎉 Seeder Success");
    console.log("");
    console.log("Login Accounts:");
    console.log("alice@test.com / 123456");
    console.log("bob@test.com / 123456");
    console.log("charlie@test.com / 123456");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

seed();
