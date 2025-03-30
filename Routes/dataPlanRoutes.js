const express = require("express");
const auth = require("../Middleware/auth");
const {
  fetchDataPlan,
  addPlan,
  updatePlan,
  deletePlan,
  dataPrice,
} = require("../Controllers/dataPlanController");
const isAdmin = require("../Middleware/isAdmin");

const router = express.Router();
router.get("/", fetchDataPlan);
router.get("/prices/:network", auth, dataPrice);
router
  .post("/add", auth, isAdmin, addPlan)
  .patch("/update", auth, isAdmin, updatePlan)
  .delete("/delete", auth, isAdmin, deletePlan);

module.exports = router;
