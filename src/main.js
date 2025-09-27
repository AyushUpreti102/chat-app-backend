const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes");
const cors = require("cors");
const { initWebsocket } = require("./websocket");

dotenv.config();

const app = express();
const PORT = 3000;

mongoose.connect(process.env.MONGOOSE_URI);

// MongoDB connection event listeners
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.use(cors());
app.use("/api", routes);

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

initWebsocket(server);
