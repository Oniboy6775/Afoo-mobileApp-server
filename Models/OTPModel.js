const mongoose = require("mongoose");
const OTPSchema = new mongoose.Schema({
  email: { type: String },
  userName: { type: String },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // this is the expiry time in seconds
  },
});
module.exports = mongoose.model("otp", OTPSchema);
