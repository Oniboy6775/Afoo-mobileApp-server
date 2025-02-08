const express = require("express");
const {
  coupon,
  flutterwave,
  initiateFlutterwave,
  monnify,
  initiateSquad,
  // squadSuccessful,
  vPay,
} = require("../Controllers/fundWalletController");
const auth = require("../Middleware/auth");
const router = express.Router();

router.post("/coupon", auth, coupon);
router.post("/flutterwave/initiate", auth, initiateFlutterwave);
router.post("/flutterwave", flutterwave);
router.post("/squad/initiate", auth, initiateSquad);
// router.post("/squad", squadSuccessful);
router.post("/monnify", monnify);
router.all("/vpay", vPay);

module.exports = router;
