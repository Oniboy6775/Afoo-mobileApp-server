const express = require("express");
const {
  gladWebhook,
  payVessel,
  autoPilot,
  billStack,
} = require("../Controllers/webhooks");
const router = express.Router();
router.post("/glad", gladWebhook);
router.post("/payVessel", payVessel);
router.post("/autoPilot", autoPilot);
router.post("/billStack", billStack);

module.exports = router;
