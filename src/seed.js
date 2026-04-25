const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const User = require("./models/users-model");
const Conversation = require("./models/conversation-model");
const Message = require("./models/message-model");

dotenv.config();

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

    console.log("🧹 DB Cleared");

    /* ================= USERS ================= */

    const password = await bcrypt.hash("123456", 10);

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

    const msg1 = await Message.create({
      conversationId: conv1._id,
      sender: alice._id,
      receiver: bob._id,
      text: "Hey Bob 👋",
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
    });

    const msg2 = await Message.create({
      conversationId: conv1._id,
      sender: bob._id,
      receiver: alice._id,
      text: "Hey Alice! What's up?",
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
    });

    const msg3 = await Message.create({
      conversationId: conv1._id,
      sender: alice._id,
      receiver: bob._id,
      text: "Building a chat app 😄",
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
    });

    const msg4 = await Message.create({
      conversationId: conv2._id,
      sender: charlie._id,
      receiver: alice._id,
      text: "Hello Alice!",
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    });

    const msg5 = await Message.create({
      conversationId: conv2._id,
      sender: alice._id,
      receiver: charlie._id,
      text: "Hey Charlie 👋",
      createdAt: new Date(Date.now() - 1000 * 60 * 12),
    });

    console.log("📨 Messages Seeded");

    /* ================= LAST MESSAGE ================= */

    await Promise.all([
      Conversation.findByIdAndUpdate(conv1._id, {
        updatedAt: msg3.createdAt,
        lastMessage: {
          text: msg3.text,
          sender: msg3.sender,
          createdAt: msg3.createdAt,
        },
      }),

      Conversation.findByIdAndUpdate(conv2._id, {
        updatedAt: msg5.createdAt,
        lastMessage: {
          text: msg5.text,
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
