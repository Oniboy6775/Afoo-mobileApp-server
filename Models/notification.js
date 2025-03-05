const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  msg: { type: String },
});
module.exports = mongoose.model("notification", notificationSchema);