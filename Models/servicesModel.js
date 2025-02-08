const mongoose = require("mongoose");
const servicesSchema = new mongoose.Schema({
  serviceName: { type: String },
  serviceType: { type: String },
  isAvailable: { type: Boolean, default: true },
});
module.exports = mongoose.model("services", servicesSchema);
