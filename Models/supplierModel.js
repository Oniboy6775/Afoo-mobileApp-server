const mongoose = require("mongoose");
const supplierSchema = new mongoose.Schema({
  network: { type: String },
  supplierName: {
    type: String,
  },
});
module.exports = mongoose.model("supplier", supplierSchema);
