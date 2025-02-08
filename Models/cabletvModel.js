const mongoose = require("mongoose");
const cableTvSchema = new mongoose.Schema({
  planName: String,
  planId: String,
  cableName: { type: String, enum: ["GOTV", "DSTV", "STARTIMES", "SHOWMAX"] },
  planCostPrince: { type: Number },
  price: String,
  resellerPrice: String,
  apiPrice: String,
});

module.exports = mongoose.model("CableTV", cableTvSchema);

// id: Number,
// cableplan_id: String,
// cable: String,
// package: String,
// plan_amount: String,
