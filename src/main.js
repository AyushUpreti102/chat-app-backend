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
const isProduction = process.env.NODE_ENV === "PROD";

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

// Required in Render/any reverse-proxy setup so secure session cookies are set.
app.set("trust proxy", 1);

app.use(express.json());

// CORS (cleaner version)
const allowedOrigins = ["http://localhost:8080", process.env.PROD_URL].filter(
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
  proxy: true,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: "sessions",
  }),
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60,
  },
});

app.use(sessionMiddleware);

/* ================= ROUTES ================= */

app.use("/api", routes);
app.use("/uploads", express.static("uploads"));

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
