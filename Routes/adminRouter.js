const express = require("express");
const auth = require("../Middleware/auth");
const router = express.Router();
const isAdmin = require("../Middleware/isAdmin");
const {
  adminDetails,
  generateCoupon,
  sendMail,
  refund,
  updateServicesAvailability,
  searchUsers,
  updatePrice,
  upgradeUser,
  updateSupplier,
  updateCostPrice,
  checkServicesAvailability,
  updateNotification,
  getNotification,
  reQueryWithdrawal,
  getSuppliers,
  getCostPrice,
  setSpecialPricing,
  approveWithdrawal,
  resetUserPassword,
} = require("../Controllers/adminController");

router.get("/", auth, isAdmin, adminDetails);
router.get("/users", auth, isAdmin, searchUsers);
router.post("/generateCoupon", auth, isAdmin, generateCoupon);
router.post("/sendMail", auth, isAdmin, sendMail);
router.post("/updateServices", auth, isAdmin, updateServicesAvailability);
router.get("/checkServices", auth, isAdmin, checkServicesAvailability);
router.post("/updatePrice", auth, isAdmin, updatePrice);
router.get("/upgradeUser/:userId/:userType", auth, isAdmin, upgradeUser);
router.post("/sendMail/:id", auth, isAdmin, sendMail);
router.post("/refund/:id", auth, isAdmin, refund);
router.get("/notification", auth, getNotification);
router.post("/notification", auth, isAdmin, updateNotification);
router.get("/costPrice", auth, isAdmin, getCostPrice);
router.post("/costPrice", auth, isAdmin, updateCostPrice);
router.post("/supplier", auth, isAdmin, updateSupplier);
router.get("/supplier", auth, isAdmin, getSuppliers);
router.post("/setSpecialPrice", auth, isAdmin, setSpecialPricing);
router.post("/approveWithdrawal", auth, isAdmin, approveWithdrawal);
router.post("/resetUserPassword", auth, isAdmin, resetUserPassword);

module.exports = router;
