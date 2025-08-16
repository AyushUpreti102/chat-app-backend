const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = 3000;

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  ws.on("message", (msg) => {
    console.log("📩 Received:", msg.toString());

    // Broadcast message to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(msg.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});
