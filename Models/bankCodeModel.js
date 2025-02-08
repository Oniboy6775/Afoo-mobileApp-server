const mongoose = require("mongoose");
const bankCodeSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  bankCode: { type: String, required: true },
  bankUssd: { type: String },
});
module.exports = mongoose.model("bankCode", bankCodeSchema);
