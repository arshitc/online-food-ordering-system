const express = require("express");
const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  impersonateUser,
  getRestaurants,
  getOrders,
  getPayments,
  getComplaints,
  resolveComplaint,
  getDeliverySettingsForAdmin,
  updateDeliverySettings
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, allowRoles("admin"));
router.get("/stats", getDashboardStats);
router.get("/users", getUsers);
router.put("/users/:id", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/impersonate", impersonateUser);
router.get("/restaurants", getRestaurants);
router.get("/orders", getOrders);
router.get("/payments", getPayments);
router.get("/complaints", getComplaints);
router.put("/complaints/:id/resolve", resolveComplaint);
router.get("/delivery-settings", getDeliverySettingsForAdmin);
router.put("/delivery-settings", updateDeliverySettings);

module.exports = router;
