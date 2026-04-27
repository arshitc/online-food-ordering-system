const express = require("express");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderQuote,
  getRestaurantOrders,
  updateRestaurantOrderStatus,
  getAssignedOrders,
  updateDeliveryStatus,
  raiseIssue,
  resolveIssueByRestaurant,
  sendIssueChatMessage,
  deleteOrderById
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("customer"), createOrder);
router.post("/quote", protect, allowRoles("customer"), getOrderQuote);
router.get("/my-orders", protect, allowRoles("customer"), getMyOrders);
router.get("/restaurant", protect, allowRoles("owner", "admin"), getRestaurantOrders);
router.put("/restaurant/:id/status", protect, allowRoles("owner", "admin"), updateRestaurantOrderStatus);
router.get("/delivery/assigned", protect, allowRoles("delivery", "admin"), getAssignedOrders);
router.put("/delivery/:id/status", protect, allowRoles("delivery", "admin"), updateDeliveryStatus);
router.put("/restaurant/:id/issue/resolve", protect, allowRoles("owner", "admin"), resolveIssueByRestaurant);
router.put("/:id/issue", protect, allowRoles("customer"), raiseIssue);
router.post("/:id/issue/chat", protect, allowRoles("customer", "owner", "admin"), sendIssueChatMessage);
router.get("/:id", protect, getOrderById);
router.delete("/:id", protect, allowRoles("customer", "admin"), deleteOrderById);

module.exports = router;
