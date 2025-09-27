const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/users-model");
const Chat = require("./models/chats-model");
const bcrypt = require("bcryptjs");

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGOOSE_URI);
  console.log("Connected to MongoDB");

  // Clear old data
  await User.deleteMany({});
  await Chat.deleteMany({});

  const salt = await bcrypt.genSalt(10);

  // Create users
  const alice = await User.create({
    username: "Alice",
    email: "alice@test.com",
    password: await bcrypt.hash("12345", salt),
  });
  const bob = await User.create({
    username: "Bob",
    email: "bob@test.com",
    password: await bcrypt.hash("12345", salt),
  });
  const charlie = await User.create({
    username: "Charlie",
    email: "charlie@test.com",
    password: await bcrypt.hash("12345", salt),
  });

  // Make friends
  alice.friends.push(bob._id, charlie._id);
  bob.friends.push(alice._id);
  charlie.friends.push(alice._id);

  await alice.save();
  await bob.save();
  await charlie.save();

  console.log("✅ Seed complete");
  process.exit();
}

seed();
