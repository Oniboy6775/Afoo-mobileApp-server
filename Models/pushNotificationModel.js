const mongoose = require("mongoose");
const pushNotificationSchema = new mongoose.Schema({
  userId: { type: String, required: [true, "user id is required"] },
  pushIsActive: { type: Boolean, default: true },
  pushToken: { type: String, required: [true, "Push token is required"] },
});
module.exports = mongoose.model("pushNotification", pushNotificationSchema);
