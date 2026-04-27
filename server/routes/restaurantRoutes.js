const express = require("express");
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getOwnerRestaurants
} = require("../controllers/restaurantController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getRestaurants);
router.get("/owner/me", protect, allowRoles("owner", "admin"), getOwnerRestaurants);
router.get("/:id", getRestaurantById);
router.post("/", protect, allowRoles("owner", "admin"), upload.single("image"), createRestaurant);
router.put("/:id", protect, allowRoles("owner", "admin"), upload.single("image"), updateRestaurant);

module.exports = router;

