const express = require("express");
const {
  addPushToken,
  sendNotifications,
} = require("../Controllers/pushNotificationController");
const auth = require("../Middleware/auth");
const isAdmin = require("../Middleware/isAdmin");
const router = express.Router();

router.post("/addToken", auth, addPushToken);
router.post("/sendNotification", auth, isAdmin, sendNotifications);
module.exports = router;
