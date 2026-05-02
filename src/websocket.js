const { WebSocketServer } = require("ws");
const ChatController = require("./controllers/chat-controller");
const Conversation = require("./models/conversation-model");

const userSockets = new Map();

const isOnline = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

const initWebsocket = (server, sessionMiddleware) => {
  const wss = new WebSocketServer({ server });
  const controller = new ChatController();

  /* ================= HELPERS ================= */

  const send = (ws, payload) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(payload));
    }
  };

  const sendToUser = (userId, payload) => {
    const sockets = userSockets.get(userId);
    if (!sockets) return;

    sockets.forEach((ws) => send(ws, payload));
  };

  const broadcast = async (payload, userId) => {
    const conversations = await Conversation.find({
      participants: userId,
    }).select("participants");

    const friendIds = new Set();

    conversations.forEach((conv) => {
      conv.participants.forEach((p) => {
        if (p.toString() !== userId.toString()) {
          friendIds.add(p.toString());
        }
      });
    });

    // send only to friends
    friendIds.forEach((fid) => {
      const sockets = userSockets.get(fid);
      if (!sockets) return;

      sockets.forEach((ws) => send(ws, payload));
    });
  };

  const addSocket = (userId, ws) => {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }

    userSockets.get(userId).add(ws);
  };

  const removeSocket = (userId, ws) => {
    const sockets = userSockets.get(userId);
    if (!sockets) return false;

    sockets.delete(ws);

    if (sockets.size === 0) {
      userSockets.delete(userId);
      return true; // fully offline
    }

    return false;
  };

  /* ================= EVENTS ================= */

  const handleEvent = async (userId, raw) => {
    try {
      const event = JSON.parse(raw.toString());

      switch (event.type) {
        case "message": {
          const { to, text, files } = event.data || {};

          if (!to) return;

          const cleanText = text?.trim() || "";
          const hasFiles = Array.isArray(files) && files.length > 0;

          if (!cleanText && !hasFiles) return;

          const saved = await controller.saveMessage(userId, {
            receiverId: to,
            text: cleanText,
            files,
          });

          const payload = {
            type: "message",
            data: saved,
          };

          sendToUser(to.toString(), payload);
          sendToUser(userId.toString(), payload);

          break;
        }

        case "typing": {
          const { to } = event.data || {};
          if (!to) return;

          sendToUser(to.toString(), {
            type: "typing",
            data: { from: userId },
          });

          break;
        }

        case "ping": {
          sendToUser(userId, { type: "pong" });
          break;
        }

        case "call-offer": {
          const { to, offer, isVideo } = event.data || {};
          if (!to || !offer) return;

          sendToUser(to.toString(), {
            type: "call-offer",
            data: {
              from: userId,
              offer,
              isVideo,
            },
          });
          break;
        }

        case "call-answer": {
          const { to, answer } = event.data || {};
          if (!to || !answer) return;

          sendToUser(to.toString(), {
            type: "call-answer",
            data: {
              from: userId,
              answer,
            },
          });
          break;
        }

        case "ice-candidate": {
          const { to, candidate } = event.data || {};
          if (!to || !candidate) return;

          sendToUser(to.toString(), {
            type: "ice-candidate",
            data: {
              from: userId,
              candidate,
            },
          });
          break;
        }

        case "call-end": {
          const { to } = event.data || {};
          if (!to) return;

          sendToUser(to.toString(), {
            type: "call-end",
            data: { from: userId },
          });
          break;
        }
      }
    } catch (err) {
      console.error("WS Event Error:", err.message);
    }
  };

  /* ================= CONNECTION ================= */

  wss.on("connection", (ws, req) => {
    sessionMiddleware(req, {}, () => {
      const userId = req.session?.userId?.toString();

      if (!userId) {
        ws.close();
        return;
      }

      const wasOffline = !isOnline(userId);

      addSocket(userId, ws);

      console.log("Connected:", userId);

      if (wasOffline) {
        broadcast(
          {
            type: "online",
            data: {
              userId,
              isOnline: true,
            },
          },
          userId,
        );
      }

      ws.isAlive = true;

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (msg) => {
        handleEvent(userId, msg);
      });

      ws.on("close", () => {
        const fullyOffline = removeSocket(userId, ws);

        console.log("Disconnected:", userId);

        if (fullyOffline) {
          broadcast(
            {
              type: "online",
              data: {
                userId,
                isOnline: false,
              },
            },
            userId,
          );
        }
      });
    });
  });

  /* ================= SERVER HEARTBEAT ================= */

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));
};

module.exports = {
  initWebsocket,
  userSockets,
  isOnline,
};
