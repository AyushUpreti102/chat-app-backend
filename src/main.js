const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const { MongoStore } = require("connect-mongo");
const Session = require("express-session");
const routes = require("./routes");
const cors = require("cors");
const { initWebsocket } = require("./websocket");

dotenv.config();

const app = express();
const PORT = 3000;
const MONGOOSE_URI = process.env.MONGOOSE_URI;

mongoose.connect(MONGOOSE_URI);

// MongoDB connection event listeners
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Middleware
app.use(express.json());

// Allowed origins
const allowedOrigins = [process.env.DEV_URL, process.env.PROD_URL].filter(
  Boolean,
);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Session
const session = Session({
  name: "sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGOOSE_URI,
    collectionName: "sessions",
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.ENV === "PROD", // true in production
    maxAge: 1000 * 60 * 60,
    sameSite: "lax",
  },
});

app.use(session);

// Routes
app.use("/api", routes);

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

initWebsocket(server);
