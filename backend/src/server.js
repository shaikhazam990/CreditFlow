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

const PORT = process.env.PORT || 3000;


const bootstrap = async () => {
  await connectDB();

  initPassport();

  const httpServer = http.createServer(app);

  initSocket(httpServer);
  registerInvoiceSocketEvents();
  registerNotificationSocketEvents();

  startCronJobs();

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




