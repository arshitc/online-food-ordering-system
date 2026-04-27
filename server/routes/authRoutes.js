const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  listDeliveryStaff
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/delivery-staff", protect, allowRoles("owner", "admin"), listDeliveryStaff);

module.exports = router;

