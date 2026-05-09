const router = require("express").Router();
const {
  getNotifications, markRead, markAllRead, deleteNotification,
} = require("../controller/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.delete("/:id", deleteNotification);

module.exports = router;
