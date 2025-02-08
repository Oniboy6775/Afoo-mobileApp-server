const mongoose = require("mongoose");
const beneficiarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  bankName: { type: String },
  bankCode: { type: String },
  accountNumber: { type: String },
  accountName: { type: String },
});
module.exports = mongoose.model("beneficiary", beneficiarySchema);
