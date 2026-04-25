// main.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const cors = require("cors");
const http = require("http");

const routes = require("./routes");
const { initWebsocket } = require("./websocket");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGOOSE_URI;

/* ================= DB CONNECTION ================= */

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1); // fail fast
  }
};

connectDB();

/* ================= MIDDLEWARE ================= */

app.use(express.json());

// CORS (cleaner version)
const allowedOrigins = [process.env.DEV_URL, process.env.PROD_URL].filter(
  Boolean,
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

/* ================= SESSION ================= */

const sessionMiddleware = session({
  name: "sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: "sessions",
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60,
  },
});

app.use(sessionMiddleware);

/* ================= ROUTES ================= */

app.use("/api", routes);

/* ================= SERVER ================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

/* ================= WEBSOCKET ================= */

initWebsocket(server, sessionMiddleware);

/* ================= GRACEFUL SHUTDOWN ================= */

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});
