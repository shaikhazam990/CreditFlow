const { getIO } = require("../config/socket");
const logger = require("../utils/logger");

const registerNotificationSocketEvents = () => {
  const io = getIO();

  io.on("connection", (socket) => {
    // Client joins their personal notification room by userId
    socket.on("subscribe_notifications", (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`Socket ${socket.id} subscribed to notifications for user ${userId}`);
    });
  });
};

/**
 * Push a notification object to a specific user's socket room.
 * Can be called from anywhere in the app after getIO() is available.
 */
const pushNotification = (userId, notification) => {
  try {
    getIO().to(`user_${userId}`).emit("notification", notification);
  } catch (err) {
    logger.warn(`pushNotification failed: ${err.message}`);
  }
};

module.exports = { registerNotificationSocketEvents, pushNotification };
