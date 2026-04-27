const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");

const getOrCreateCart = async (customerId) => {
  let cart = await Cart.findOne({ customerId });
  if (!cart) {
    cart = await Cart.create({ customerId, items: [] });
  }
  return cart;
};

const getPopulatedCart = async (customerId) =>
  Cart.findOne({ customerId }).populate("items.restaurantId", "name location city image");

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const populatedCart = await getPopulatedCart(req.user._id);
  res.json(populatedCart || cart);
});

const addToCart = asyncHandler(async (req, res) => {
  const { menuItemId, quantity = 1 } = req.body;
  const menuItem = await MenuItem.findById(menuItemId);

  if (!menuItem || !menuItem.availability) {
    res.status(404);
    throw new Error("Menu item is not available");
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find(
    (item) => item.menuItem.toString() === menuItemId
  );

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({
      menuItem: menuItem._id,
      restaurantId: menuItem.restaurantId,
      quantity: Number(quantity),
      price: menuItem.price,
      itemName: menuItem.itemName,
      image: menuItem.image
    });
  }

  await cart.save();
  const populatedCart = await getPopulatedCart(req.user._id);
  res.json(populatedCart || cart);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((cartItem) => cartItem.menuItem.toString() === req.params.itemId);

  if (!item) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  item.quantity = Number(quantity);
  if (item.quantity <= 0) {
    cart.items = cart.items.filter((cartItem) => cartItem.menuItem.toString() !== req.params.itemId);
  }

  await cart.save();
  const populatedCart = await getPopulatedCart(req.user._id);
  res.json(populatedCart || cart);
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((cartItem) => cartItem.menuItem.toString() !== req.params.itemId);
  await cart.save();
  const populatedCart = await getPopulatedCart(req.user._id);
  res.json(populatedCart || cart);
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ message: "Cart cleared" });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
