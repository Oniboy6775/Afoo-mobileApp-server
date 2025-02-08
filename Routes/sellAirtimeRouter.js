const app = require("express");
const router = app.Router();
const auth = require("../Middleware/auth");
const {
  getOTP,
  verifyOTP,
  transferAirtime,
} = require("../Controllers/sellAirtimeController");
router.post("/getOTP", auth, getOTP);
router.post("/verifyOTP", auth, verifyOTP);
router.post("/transferAirtime", auth, transferAirtime);

module.exports = router;
