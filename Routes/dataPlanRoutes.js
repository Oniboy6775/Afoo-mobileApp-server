const express = require("express");
const auth = require("../Middleware/auth");
const { fetchDataPlan } = require("../Controllers/dataPlanController");
const router = express.Router();
router.get("/", fetchDataPlan);

module.exports = router;
