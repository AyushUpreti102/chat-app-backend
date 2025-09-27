const { WebSocketServer } = require("ws");
const { parse } = require("url");
const ChatController = require("./controllers/chat-controller");

const initWebsocket = (server) => {
  // Create WebSocket server
  const clients = new Map();
  const wss = new WebSocketServer({ server });
  const controller = new ChatController();

  const sendMessage = (userId, data) => {
    const msg = JSON.parse(data);

    controller.saveMessageToDb(userId, msg);

    // Broadcast message to the specific client
    const targetWs = clients.get(msg.to);

    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(
        JSON.stringify({
          from: userId,
          text: msg.text,
        })
      );
    }
  };

  wss.on("connection", (ws, req) => {
    const { query } = parse(req.url, true);
    const userId = query.userId;

    if (!userId) {
      ws.close();
      return;
    }

    console.log("🔗 Client connected with user Id", userId);

    clients.set(userId, ws);

    ws.on("message", (data) => sendMessage(userId, data));

    ws.on("close", () => {
      clients.delete(userId);
      console.log("❌ Client disconnected");
    });
  });
};

module.exports = {
  initWebsocket,
};
