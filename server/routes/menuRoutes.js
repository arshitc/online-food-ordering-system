const express = require("express");
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controllers/menuController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getMenuItems);
router.post("/", protect, allowRoles("owner", "admin"), upload.single("image"), createMenuItem);
router.put("/:id", protect, allowRoles("owner", "admin"), upload.single("image"), updateMenuItem);
router.delete("/:id", protect, allowRoles("owner", "admin"), deleteMenuItem);

module.exports = router;

