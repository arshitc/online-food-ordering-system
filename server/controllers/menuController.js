const asyncHandler = require("express-async-handler");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");

const getMenuItems = asyncHandler(async (req, res) => {
  const { restaurantId, category } = req.query;
  const query = {};

  if (restaurantId) query.restaurantId = restaurantId;
  if (category) query.category = category;

  const items = await MenuItem.find(query).populate("restaurantId", "name city");
  res.json(items);
});

const createMenuItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.body.restaurantId);
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }

  if (
    req.user.role !== "admin" &&
    restaurant.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not allowed to manage this restaurant menu");
  }

  const menuItem = await MenuItem.create({
    ...req.body,
    image: req.file ? `/${req.file.path}` : req.body.image || ""
  });

  res.status(201).json(menuItem);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id).populate("restaurantId");
  if (!menuItem) {
    res.status(404);
    throw new Error("Menu item not found");
  }

  if (
    req.user.role !== "admin" &&
    menuItem.restaurantId.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not allowed to update this item");
  }

  Object.assign(menuItem, req.body);
  if (req.file) {
    menuItem.image = `/${req.file.path}`;
  }

  const updated = await menuItem.save();
  res.json(updated);
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id).populate("restaurantId");
  if (!menuItem) {
    res.status(404);
    throw new Error("Menu item not found");
  }

  if (
    req.user.role !== "admin" &&
    menuItem.restaurantId.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not allowed to delete this item");
  }

  await menuItem.deleteOne();
  res.json({ message: "Menu item deleted successfully" });
});

module.exports = {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};

