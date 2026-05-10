const { getIO } = require("../config/socket");
const logger = require("../utils/logger");

const registerNotificationSocketEvents = () => {
  const io = getIO();

  io.on("connection", (socket) => {
    socket.on("subscribe_notifications", (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`Socket ${socket.id} subscribed to notifications for user ${userId}`);
    });
  });
};


const pushNotification = (userId, notification) => {
  try {
    getIO().to(`user_${userId}`).emit("notification", notification);
  } catch (err) {
    logger.warn(`pushNotification failed: ${err.message}`);
  }
};

module.exports = { registerNotificationSocketEvents, pushNotification };
