const express = require("express");
const { generateAccount } = require("../Controllers/generateAccountController");
const auth = require("../Middleware/auth");
const router = express.Router();

router.post("/", auth, generateAccount);
module.exports = router;
