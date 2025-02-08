const mongoose = require("mongoose");
const dataSchema = new mongoose.Schema({
  id: Number,
  dataplan_id: String,
  network: Number,
  plan_network: String,
  plan_type: String,
  month_validate: String,
  plan: String,
  plan_amount: String,
  my_price: String,
  resellerPrice: String,
  partnerPrice: String,
  apiPrice: String,
  volumeRatio: Number,
  planCostPrice: { type: Number, default: 0 },
});
module.exports = mongoose.model("data", dataSchema);
