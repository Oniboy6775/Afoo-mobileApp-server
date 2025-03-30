const express = require("express");

const {
  searchTransaction,
  getTransactions,
} = require("../Controllers/transactionsController");
const router = express.Router();

router.get("/all", getTransactions);
router.get("/", searchTransaction);
module.exports = router;
