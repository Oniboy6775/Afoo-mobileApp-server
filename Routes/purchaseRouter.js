const express = require("express");
const {
  buyAirtime,
  buyData,
  buyElectricity,
  buyCableTv,
  validateMeter,
  validateCableTv,
  buyMtnCGData,
  fetchCable,
  fetchDiscos,
} = require("../Controllers/purchaseControllers");
const router = express.Router();
const validateNumber = require("../Middleware/validateNumber");
router.post("/airtime", validateNumber, buyAirtime); //b2b airtime
router.post("/data", validateNumber, buyData);
router.post("/electricity", buyElectricity);
router.post("/cableTv", buyCableTv);
router.post("/cableTvPlans", fetchCable);
router.get("/fetchDiscos", fetchDiscos);
router.post("/validatemeter", validateMeter);
router.post("/validatecabletv", validateCableTv);

module.exports = router;
