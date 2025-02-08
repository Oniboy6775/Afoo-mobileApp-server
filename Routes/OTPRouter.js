const express = require("express");
const { sendOTP, verifyOTP } = require("../Controllers/OTPController");
const router = express.Router();

router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);
module.exports = router;
