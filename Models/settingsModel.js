const mongoose = require("mongoose");
const settingsSchema = new mongoose.Schema(
  {
    resellerUserUpgradeAmount: {
      type: Number,
      required: [true, "Please provide upgrade amount"],
    },
    apiUserUpgradeAmount: {
      type: Number,
      required: [true, "Please provide upgrade amount"],
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("settings", settingsSchema);
