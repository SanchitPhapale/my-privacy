require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const connectDB = require("./config/database");
const cors = require("cors");


const app = express();
app.use(cors());
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const PORT = process.env.PORT || 3600;

// Storage configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

// Room Configuration
const ROOM_CONFIG = {
  password: "$anchit@10090807060504030201",
  hostUsername: "SANCHIT12",
  hostPhone: "7300092727",
  hostId: "host-" + uuidv4(),
};

// In-memory storage
let messages = [];

let onlineUsers = new Map();
let typingUsers = new Set();
let deletedMessageIds = new Set();
let pendingRequests = new Map();
let bannedUsers = new Set();

// Auto-delete interval (15 minutes)
const AUTO_DELETE_TIME = 15 * 60 * 1000;

// Serve static files
app.get("/", (req, res) => {
 res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Main route

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    originalName: req.file.originalname,
    filename: req.file.filename,
    url: fileUrl,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  let currentUser = null;

  // Handle join room
  socket.on("join-room", (data, callback) => {
    const { name, username, phone, password } = data;

    if (!/^\d{10}$/.test(phone)) {
      callback({
        success: false,
        error: "Invalid phone number",
      });
      return;
    }
    console.log("LOGIN TRY:", username.toLowerCase());
    console.log("CURRENT BANNED:", [...bannedUsers]);

    if (bannedUsers.has(username.toLowerCase())) {
      callback({
        success: false,
        error: "🚫 You are banned by the host.",
      });
      return;
    }

    if (password !== ROOM_CONFIG.password) {
      callback({ success: false, error: "Invalid room password" });
      return;
    }

    if (!username || username.trim().length === 0) {
      callback({ success: false, error: "Username is required" });
      return;
    }

    if (!phone || phone.trim().length === 0) {
      callback({ success: false, error: "Phone number is required" });
      return;
    }

    const existingUser = Array.from(onlineUsers.values()).find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );

    if (existingUser) {
      callback({ success: false, error: "Username already taken" });
      return;
    }

    if (
      username === ROOM_CONFIG.hostUsername &&
      phone !== ROOM_CONFIG.hostPhone
    ) {
      callback({
        success: false,
        error: "Invalid host phone number",
      });
      return;
    }

    const isHost =
      username === ROOM_CONFIG.hostUsername && phone === ROOM_CONFIG.hostPhone;
    currentUser = {
      id: isHost ? ROOM_CONFIG.hostId : socket.id,
      name: name || username,
      username: username,
      phone: phone,
      isHost: isHost,
      joinTime: new Date(),
      socketId: socket.id,
    };

    // Members need host approval
    if (!isHost) {
      const host = Array.from(onlineUsers.values()).find((u) => u.isHost);

      if (!host) {
        callback({
          success: false,
          error: "Host is not online.",
        });
        return;
      }

      pendingRequests.set(socket.id, currentUser);

      io.to(host.socketId).emit("join-request", {
        socketId: socket.id,
        name: currentUser.name,
        username: currentUser.username,
        phone: currentUser.phone,
      });

      callback({
        success: false,
        pending: true,
        error: "Waiting for host approval...",
      });

      return;
    }

    onlineUsers.set(socket.id, currentUser);
    socket.join("chat-room");

    callback({
      success: true,
      user: currentUser,
      messages: messages.filter((m) => !deletedMessageIds.has(m.id)),
    });

    socket.to("chat-room").emit("user-joined", {
      user: currentUser,
      onlineCount: onlineUsers.size,
    });

    io.to("chat-room").emit("users-update", {
      users: Array.from(onlineUsers.values()),
      onlineCount: onlineUsers.size,
    });
  });

  // Handle send message
  socket.on("send-message", (messageData, callback) => {
    if (!currentUser) return;

    const message = {
      id: uuidv4(),
      userId: currentUser.id,
      username: currentUser.username,
      name: currentUser.name,
      content: messageData.content || "",
      type: messageData.type || "text",
      file: messageData.file || null,
      replyTo: messageData.replyTo || null,
      timestamp: new Date(),
      createdAt: Date.now(),
      isDeleted: false,
      reactions: {},
    };

    messages.push(message);

    setTimeout(() => {
      deleteMessage(message.id);
    }, AUTO_DELETE_TIME);

    message.deletesIn = AUTO_DELETE_TIME;

    io.to("chat-room").emit("new-message", message);

    if (callback) callback({ success: true, message });
  });

  // Handle edit message
  socket.on("edit-message", (data, callback) => {
    if (!currentUser)
      return callback({ success: false, error: "Not authenticated" });

    const message = messages.find((m) => m.id === data.messageId);
    if (!message) {
      return callback({ success: false, error: "Message not found" });
    }

    if (message.userId !== currentUser.id && !currentUser.isHost) {
      return callback({ success: false, error: "Not authorized" });
    }

    message.content = data.content;
    message.edited = true;
    message.editedAt = new Date();

    io.to("chat-room").emit("message-edited", {
      messageId: message.id,
      content: message.content,
      edited: true,
      editedAt: message.editedAt,
    });

    callback({ success: true });
  });
  // Handle delete message
  socket.on("delete-message", (data, callback) => {
    if (!currentUser)
      return callback({ success: false, error: "Not authenticated" });

    const message = messages.find((m) => m.id === data.messageId);

    if (!message)
      return callback({ success: false, error: "Message not found" });

    if (message.userId !== currentUser.id && !currentUser.isHost)
      return callback({ success: false, error: "Not authorized" });

    // Don't remove the message
    deleteMessage(
      message.id,
      currentUser.isHost && message.userId !== currentUser.id ? "host" : "user",
      currentUser.id,
    );

    if (callback) callback({ success: true });
  });

  socket.on("toggle-reaction", (data) => {
    if (!currentUser) return;

    const message = messages.find((m) => m.id === data.messageId);
    if (!message) return;

    if (!message.reactions) {
      message.reactions = {};
    }

    const emoji = data.emoji;

    // User already reacted with this emoji?

    console.log("REACTIONS:", message.reactions);
    console.log("EMOJI:", emoji);
    const currentName = currentUser.name || currentUser.username;

    const alreadyReacted = message.reactions[emoji]?.some(
      (u) => u.name === currentName,
    );

    console.log("ALREADY:", alreadyReacted);

    if (alreadyReacted) {
      // REMOVE same emoji
      message.reactions[emoji] = message.reactions[emoji].filter(
        (u) => u.name !== currentName,
      );

      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
    } else {
      // Remove user from all previous emojis
      Object.keys(message.reactions).forEach((e) => {
        message.reactions[e] = message.reactions[e].filter(
          (u) => u.name !== currentName,
        );

        if (message.reactions[e].length === 0) {
          delete message.reactions[e];
        }
      });

      // Add new emoji
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = [];
      }

      message.reactions[emoji].push({
        userId: currentUser.id,
        name: currentUser.name || currentUser.username,
      });
    }

    io.to("chat-room").emit("reaction-updated", {
      messageId: message.id,
      reactions: message.reactions,
    });
  });

  // Handle typing
  socket.on("typing-start", () => {
    if (!currentUser) return;
    typingUsers.add(currentUser.id);
    io.to("chat-room").emit("typing-update", {
      user: currentUser,
      typingUsers: Array.from(typingUsers)
        .map((id) => {
          const user = Array.from(onlineUsers.values()).find(
            (u) => u.id === id,
          );
          console.log("TYPING USER:", user);
          return user ? user.name || user.username : null;
        })
        .filter(Boolean),
    });
  });

  socket.on("typing-stop", () => {
    if (!currentUser) return;
    typingUsers.delete(currentUser.id);
    io.to("chat-room").emit("typing-update", {
      user: currentUser,
      typingUsers: Array.from(typingUsers)
        .map((id) => {
          const user = Array.from(onlineUsers.values()).find(
            (u) => u.id === id,
          );
          console.log("TYPING USER:", user);
          return user ? user.name || user.username : null;
        })
        .filter(Boolean),
    });
  });

  // Handle kick user (host only)
  socket.on("kick-user", (data, callback) => {
    if (!currentUser || !currentUser.isHost) {
      return callback({ success: false, error: "Not authorized" });
    }

    const targetSocketId = data.socketId;
    const targetUser = onlineUsers.get(targetSocketId);

    if (!targetUser) {
      return callback({ success: false, error: "User not found" });
    }

    io.to(targetSocketId).emit("kicked", {
      reason: data.reason || "Kicked by host",
    });

    callback({ success: true });
  });

  // Handle ban user (host only)
  socket.on("ban-user", (data, callback) => {
    console.log("🔥 BAN EVENT CALLED");
    console.log("DATA:", data);

    if (!currentUser || !currentUser.isHost) {
      return callback?.({
        success: false,
        error: "Not authorized",
      });
    }

    // Find user by socketId
    const targetUser = Array.from(onlineUsers.values()).find(
      (u) => u.socketId === data.socketId,
    );

    if (!targetUser) {
      return callback?.({
        success: false,
        error: "User not found",
      });
    }

    // Permanently ban phone number
    bannedUsers.add(targetUser.username.toLowerCase());

    console.log("✅ BANNED:", targetUser.username.toLowerCase());
    console.log("SET:", [...bannedUsers]);
    console.log("BANNED USERNAME:", targetUser.username.toLowerCase());
    // Notify banned user
    io.to(targetUser.socketId).emit("kicked", {
      reason: "🚫 You have been permanently banned by the host.",
    });

    // Disconnect user
    const targetSocket = io.sockets.sockets.get(targetUser.socketId);

    if (targetSocket) {
      targetSocket.disconnect(true);

      onlineUsers.delete(targetUser.socketId);

      io.to("chat-room").emit("users-update", {
        users: Array.from(onlineUsers.values()),
        onlineCount: onlineUsers.size,
      });
    }

    // Remove from online users
    onlineUsers.delete(targetUser.socketId);

    io.to("chat-room").emit("users-update", {
      users: Array.from(onlineUsers.values()),
      onlineCount: onlineUsers.size,
    });

    callback?.({
      success: true,
    });
  });

  // Host approves user
  socket.on("approve-user", (data) => {
    console.log("🔥 APPROVE USER EVENT");
    console.log(data);

    if (!currentUser || !currentUser.isHost) return;

    const pendingUser = pendingRequests.get(data.socketId);
    console.log("PENDING USER:", pendingUser);

    if (!pendingUser) {
      console.log("Pending user not found");
      return;
    }

    onlineUsers.set(data.socketId, pendingUser);

    const targetSocket = io.sockets.sockets.get(data.socketId);

    if (!targetSocket) {
      console.log("Target socket not found");
      return;
    }

    targetSocket.join("chat-room");

    console.log("SENDING JOIN APPROVED");
    io.to(data.socketId).emit("join-approved", {
      user: pendingUser,
      messages: messages.filter((m) => !deletedMessageIds.has(m.id)),
    });

    pendingRequests.delete(data.socketId);

    io.to("chat-room").emit("user-joined", {
      user: pendingUser,
      onlineCount: onlineUsers.size,
    });

    io.to("chat-room").emit("users-update", {
      users: Array.from(onlineUsers.values()),
      onlineCount: onlineUsers.size,
    });

    console.log("✅ USER APPROVED");
  });

  // Host rejects user
  socket.on("reject-user", (data) => {
    console.log("❌ REJECT EVENT");
    console.log(data);
    if (!currentUser || !currentUser.isHost) return;

    const pendingUser = pendingRequests.get(data.socketId);

    if (!pendingUser) return;

    io.to(data.socketId).emit("join-rejected", {
      message: "❌ Your request was rejected by the host.",
    });

    pendingRequests.delete(data.socketId);
  });

  // Handle change password (host only)
  socket.on("change-password", (data, callback) => {
    if (!currentUser || !currentUser.isHost) {
      return callback({ success: false, error: "Not authorized" });
    }
    ROOM_CONFIG.password = data.newPassword;
    callback({ success: true });
  });

  // Handle clear messages (host only)
  socket.on("clear-messages", (data, callback) => {
    if (!currentUser || !currentUser.isHost) {
      return callback({ success: false, error: "Not authorized" });
    }

    messages.forEach((m) => {
      deletedMessageIds.add(m.id);
    });

    io.to("chat-room").emit("messages-cleared");
    callback({ success: true });
  });

  // Handle disconnect
  // Handle disconnect
  socket.on("disconnect", () => {
    // 🚪 Host left => close room for everyone
    if (currentUser && currentUser.isHost) {
      io.to("chat-room").emit("room-closed", {
        message: "🚪 Host has closed the room.",
      });

      onlineUsers.clear();
      pendingRequests.clear();
      typingUsers.clear();

      console.log("ROOM CLOSED BY HOST");

      return;
    }

    if (currentUser) {
      onlineUsers.delete(socket.id);
      typingUsers.delete(currentUser.id);

      io.to("chat-room").emit("user-left", {
        user: currentUser,
        onlineCount: onlineUsers.size,
      });

      io.to("chat-room").emit("users-update", {
        users: Array.from(onlineUsers.values()),
        onlineCount: onlineUsers.size,
      });

      io.to("chat-room").emit("typing-update", {
        typingUsers: Array.from(typingUsers)
          .map((id) => {
            const user = Array.from(onlineUsers.values()).find(
              (u) => u.id === id,
            );
            return user ? user.name || user.username : null;
          })
          .filter(Boolean),
      });
    }
  });
});

// Helper function to delete message
// Helper function to delete message
function deleteMessage(messageId, deletedBy = "user") {
  const message = messages.find((m) => m.id === messageId);

  if (!message) return;

  message.isDeleted = true;
  message.deletedBy = deletedBy;

  deletedMessageIds.add(messageId);

  // DON'T delete uploaded files immediately.
  // They are needed so the deleted message can still exist.

  io.to("chat-room").emit("message-deleted", {
    messageId,

    deletedBy,
  });
}

// Clean up old messages periodically
setInterval(() => {
  const now = Date.now();
  messages = messages.filter((m) => {
    if (now - m.createdAt > AUTO_DELETE_TIME) {
      deletedMessageIds.add(m.id);
      return false;
    }
    return true;
  });
}, 60000);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 PrivateChat Room server running on port ${PORT}`);

  if (process.env.PORT) {
    console.log("🌍 Running in production (Render)");
  } else {
    console.log(`💻 Local: http://localhost:${PORT}`);
  }
});