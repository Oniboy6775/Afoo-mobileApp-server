const express = require("express");

const searchTransaction = require("../Controllers/transactionsController");
const isAdmin = require("../Middleware/isAdmin");
const { getStat } = require("../Controllers/statsController");
const router = express.Router();

router.get("/", searchTransaction);
router.get("/stat", isAdmin, getStat);
module.exports = router;
