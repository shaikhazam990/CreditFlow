
const { getIO } = require("../config/socket");
const logger = require("../utils/logger");

const registerInvoiceSocketEvents = () => {
  const io = getIO();

  io.on("connection", (socket) => {
    socket.on("watch_invoice", (invoiceId) => {
      socket.join(`invoice_${invoiceId}`);
      logger.info(`Socket ${socket.id} watching invoice ${invoiceId}`);
    });

    socket.on("unwatch_invoice", (invoiceId) => {
      socket.leave(`invoice_${invoiceId}`);
    });
  });
};


module.exports = { registerInvoiceSocketEvents };
