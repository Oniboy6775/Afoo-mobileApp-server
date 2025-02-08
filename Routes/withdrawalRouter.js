const express = require("express");
const {
  validateAccountNumber,
  allBankCodes,
  withdraw,
  addBeneficiary,
  fetchBeneficiary,
} = require("../Controllers/withdrawalController");
const auth = require("../Middleware/auth");
const router = express.Router();

router.post("/", auth, withdraw);
router.post("/beneficiary", auth, addBeneficiary);
router.get("/beneficiary", auth, fetchBeneficiary);
router.get("/bankCodes", auth, allBankCodes);
router.post("/validate", auth, validateAccountNumber);
module.exports = router;
