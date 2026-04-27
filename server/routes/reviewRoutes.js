const express = require("express");
const { createReview, getRestaurantReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/:restaurantId", getRestaurantReviews);
router.post("/", protect, allowRoles("customer"), createReview);

module.exports = router;

