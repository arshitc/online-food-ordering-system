const express = require("express");
const {
  createPaymentIntent,
  confirmPayment,
  getMyPayments
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/create-intent", protect, allowRoles("customer"), createPaymentIntent);
router.post("/confirm", protect, allowRoles("customer"), confirmPayment);
router.get("/my-payments", protect, allowRoles("customer"), getMyPayments);

module.exports = router;

