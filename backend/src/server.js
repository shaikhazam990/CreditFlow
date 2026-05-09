require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/database");
const { initSocket } = require("./config/socket");
const { initPassport } = require("./config/passport");
const { registerInvoiceSocketEvents } = require("./socket/invoice.socket");
const { registerNotificationSocketEvents } = require("./socket/notification.socket");
const { startCronJobs } = require("./services/cron.service");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Initialise Passport strategies (must run after DB is ready)
  initPassport();

  // 3. Create HTTP server from Express app
  const httpServer = http.createServer(app);

  // 4. Attach Socket.io
  initSocket(httpServer);
  registerInvoiceSocketEvents();
  registerNotificationSocketEvents();

  // 5. Start cron jobs
  startCronJobs();

  // 6. Listen
  httpServer.listen(PORT, () => {
    logger.info(
      `Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`
    );
    logger.info(
      `Google OAuth endpoint: http://localhost:${PORT}/api/auth/google`
    );
  });
};

bootstrap().catch((err) => {
  logger.error(`Bootstrap failed: ${err.message}`);
  process.exit(1);
});
