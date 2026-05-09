const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io;

/**
 * Initialise Socket.io and attach to the HTTP server.
 * Call once from server.js, then access via getIO() anywhere.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Let clients join a personal room using their userId
    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`Socket ${socket.id} joined room user_${userId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialised — call initSocket first");
  return io;
};

module.exports = { initSocket, getIO };

